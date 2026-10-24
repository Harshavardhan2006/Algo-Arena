package com.algoarena.execution;

import com.algoarena.model.Race;
import com.algoarena.model.Run;
import com.algoarena.model.RunEvent;
import com.algoarena.repository.RaceRepository;
import com.algoarena.repository.RunEventRepository;
import com.algoarena.repository.RunRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ExecutionService {

    private static class RunPauseState {
        volatile long pausedSince = 0L;
        final AtomicLong totalPausedMs = new AtomicLong(0L);
    }

    private final RunRepository runRepository;
    private final RaceRepository raceRepository;
    private final RunEventRepository runEventRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<Long, String> runningContainers = new ConcurrentHashMap<>();
    private final Set<Long> cancelledRaces = ConcurrentHashMap.newKeySet();
    private final Set<Long> pausedRaces = ConcurrentHashMap.newKeySet();
    private final ConcurrentMap<Long, RunPauseState> pauseStates = new ConcurrentHashMap<>();

    @Value("${algoarena.execution.max-runtime-seconds}")
    private long maxRuntimeSeconds;

    @Value("${algoarena.execution.docker-image}")
    private String dockerImage;

    @Value("${algoarena.execution.memory-limit}")
    private String memoryLimit;

    @Value("${algoarena.execution.cpu-limit}")
    private String cpuLimit;

    public ExecutionService(RunRepository runRepository, RaceRepository raceRepository,
                            RunEventRepository runEventRepository,
                            SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.runRepository = runRepository;
        this.raceRepository = raceRepository;
        this.runEventRepository = runEventRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    private boolean runDockerCommand(String... args) {
        try {
            Process process = new ProcessBuilder(args)
                    .redirectErrorStream(true)
                    .start();
            return process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception ignored) {
            return false;
        }
    }

    private void killContainer(String name) {
        runDockerCommand("docker", "rm", "-f", name);
    }

    private long activeElapsedMs(Long runId, long beginMillis) {
        long now = System.currentTimeMillis();
        RunPauseState state = pauseStates.get(runId);
        if (state == null) {
            return now - beginMillis;
        }
        long since = state.pausedSince;
        long total = state.totalPausedMs.get();
        long current = since > 0 ? now - since : 0;
        return now - beginMillis - total - current;
    }

    public void pauseRace(Long raceId) {
        pausedRaces.add(raceId);
        for (Run run : runRepository.findByRaceId(raceId)) {
            Long runId = run.getId();
            String container = runningContainers.get(runId);
            if (container != null) {
                if (runDockerCommand("docker", "pause", container)) {
                    RunPauseState state = pauseStates.get(runId);
                    if (state != null && state.pausedSince == 0L) {
                        state.pausedSince = System.currentTimeMillis();
                    }
                }
            }
        }
    }

    public void resumeRace(Long raceId) {
        pausedRaces.remove(raceId);
        for (Run run : runRepository.findByRaceId(raceId)) {
            Long runId = run.getId();
            String container = runningContainers.get(runId);
            RunPauseState state = pauseStates.get(runId);
            if (container != null && state != null && state.pausedSince > 0L) {
                long since = state.pausedSince;
                if (runDockerCommand("docker", "unpause", container)) {
                    long now = System.currentTimeMillis();
                    state.totalPausedMs.addAndGet(now - since);
                    state.pausedSince = 0L;
                }
            }
        }
    }

    public void broadcast(Long raceId, String type) {
        send(raceId, new RunProgressEvent(null, null, null, type, null, null, null, null, null, null));
    }

    public void clearPause(Long raceId) {
        pausedRaces.remove(raceId);
    }

    public void cancelRace(Long raceId) {
        cancelledRaces.add(raceId);
        pausedRaces.remove(raceId);
        for (Run run : runRepository.findByRaceId(raceId)) {
            String container = runningContainers.get(run.getId());
            if (container != null) {
                killContainer(container);
            }
        }
    }

    @Async("raceExecutor")
    public void executeRun(Long runId) {
        Run run = runRepository.findById(runId).orElseThrow();
        Long raceId = run.getRace().getId();
        String code = run.getAlgorithm().getCode();

        while (pausedRaces.contains(raceId) && !cancelledRaces.contains(raceId)) {
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (cancelledRaces.contains(raceId)) {
            run.setStatus("cancelled");
            run.setCompletedAt(Instant.now());
            runRepository.save(run);
            RunEvent event = new RunEvent();
            event.setRunId(runId);
            event.setEventTime(Instant.now());
            event.setIteration(0L);
            event.setCurrentScore(null);
            event.setElapsedMs(0L);
            event.setEventType("cancelled");
            event = runEventRepository.save(event);
            send(raceId, new RunProgressEvent(event.getId(), runId, code, "cancelled", 0L, null, 0L, null, null, null));
            closeRaceIfDone(raceId);
            return;
        }

        run.setStatus("running");
        run.setStartedAt(Instant.now());
        runRepository.save(run);

        RunEvent startedEvent = new RunEvent();
        startedEvent.setRunId(runId);
        startedEvent.setEventTime(Instant.now());
        startedEvent.setIteration(0L);
        startedEvent.setCurrentScore(null);
        startedEvent.setElapsedMs(0L);
        startedEvent.setEventType("started");
        startedEvent = runEventRepository.save(startedEvent);
        send(raceId, new RunProgressEvent(startedEvent.getId(), runId, code, "started", 0L, null, 0L, null, null, null));

        long begin = System.currentTimeMillis();
        Path inputFile = null;
        boolean sawFinal = false;
        Double finalScore = null;
        Long finalIteration = null;
        Double lastScore = null;
        Long lastIteration = null;
        Double computeMs = null;
        Map<String, Object> finalPayload = null;
        AtomicBoolean timedOut = new AtomicBoolean(false);
        String failure = null;

        int keptCount = 1;
        Double lastKeptScore = null;
        Long lastKeptElapsedMs = 0L;
        boolean firstWorkerEvent = true;

        try {
            inputFile = Files.createTempFile("algoarena-", ".json");
            String json = objectMapper.writeValueAsString(run.getRace().getDataset().getRawInput());
            Files.writeString(inputFile, json, StandardCharsets.UTF_8);

            String containerName = "algoarena-" + runId + "-" + UUID.randomUUID().toString().substring(0, 8);
            ProcessBuilder builder = new ProcessBuilder(
                    "docker", "run", "--rm",
                    "--name", containerName,
                    "--memory", memoryLimit,
                    "--memory-swap", memoryLimit,
                    "--cpus", cpuLimit,
                    "--pids-limit", "64",
                    "--network", "none",
                    "--read-only",
                    "--tmpfs", "/tmp",
                    "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges",
                    "-v", inputFile.toAbsolutePath() + ":/input.json:ro",
                    dockerImage,
                    "node", "/app/workers/" + run.getAlgorithm().getWorkerEntrypoint(), "/input.json");
            builder.redirectErrorStream(true);
            runningContainers.put(runId, containerName);
            pauseStates.put(runId, new RunPauseState());
            if (cancelledRaces.contains(raceId)) {
                run.setStatus("cancelled");
                run.setCompletedAt(Instant.now());
                runRepository.save(run);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(0L);
                event.setCurrentScore(null);
                event.setElapsedMs(0L);
                event.setEventType("cancelled");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "cancelled", 0L, null, 0L, null, null, null));
                closeRaceIfDone(raceId);
                runningContainers.remove(runId);
                pauseStates.remove(runId);
                return;
            }
            Process process = builder.start();

            long timeLimit = run.getRace().getTimeLimitSeconds();
            Thread watchdog = new Thread(() -> {
                long watchdogStart = System.currentTimeMillis();
                long lastKillAttempt = 0L;
                long lastPauseAttempt = 0L;
                RunPauseState pauseState = pauseStates.get(runId);
                try {
                    while (process.isAlive()) {
                        if (cancelledRaces.contains(raceId)) {
                            long now = System.currentTimeMillis();
                            if (now - lastKillAttempt >= 500) {
                                killContainer(containerName);
                                lastKillAttempt = now;
                            }
                        } else {
                            if (pausedRaces.contains(raceId)) {
                                if (pauseState != null && pauseState.pausedSince == 0L) {
                                    long now = System.currentTimeMillis();
                                    if (now - lastPauseAttempt >= 300) {
                                        lastPauseAttempt = now;
                                        if (runDockerCommand("docker", "pause", containerName)) {
                                            pauseState.pausedSince = System.currentTimeMillis();
                                        }
                                    }
                                }
                            } else {
                                if (pauseState != null && pauseState.pausedSince > 0L) {
                                    long since = pauseState.pausedSince;
                                    if (runDockerCommand("docker", "unpause", containerName)) {
                                        long now = System.currentTimeMillis();
                                        pauseState.totalPausedMs.addAndGet(now - since);
                                        pauseState.pausedSince = 0L;
                                    }
                                }
                            }

                            long now = System.currentTimeMillis();
                            long totalPaused = pauseState != null ? pauseState.totalPausedMs.get() : 0L;
                            long currentPause = (pauseState != null && pauseState.pausedSince > 0L)
                                    ? now - pauseState.pausedSince : 0L;
                            long activeTime = now - watchdogStart - totalPaused - currentPause;

                            if (activeTime > timeLimit * 1000L) {
                                timedOut.set(true);
                                killContainer(containerName);
                                process.destroyForcibly();
                                break;
                            }
                        }
                        Thread.sleep(100);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            watchdog.setDaemon(true);
            watchdog.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    JsonNode event;
                    try {
                        event = objectMapper.readTree(line);
                    } catch (Exception notJson) {
                        continue;
                    }
                    if (event == null || !event.isObject()) {
                        continue;
                    }

                    String type = event.path("type").asText("progress");
                    Long iteration = event.hasNonNull("iteration") ? event.get("iteration").asLong() : null;
                    Double score = event.hasNonNull("score") ? event.get("score").asDouble() : null;
                    Double compute = event.hasNonNull("computeMs") ? event.get("computeMs").asDouble() : null;
                    Double progress = event.hasNonNull("progress") ? event.get("progress").asDouble() : null;
                    JsonNode statsNode = event.get("stats");
                    Map<String, Object> stats = (statsNode != null && statsNode.isObject())
                            ? objectMapper.convertValue(statsNode, new TypeReference<Map<String, Object>>() {})
                            : null;
                    JsonNode payload = event.get("payload");

                    if (score != null) {
                        lastScore = score;
                    }
                    if (iteration != null) {
                        lastIteration = iteration;
                    }

                    if ("final".equals(type)) {
                        sawFinal = true;
                        finalScore = score;
                        finalIteration = iteration;
                        computeMs = compute;
                        if (payload != null) {
                            finalPayload = objectMapper.convertValue(payload, new TypeReference<Map<String, Object>>() {});
                        }
                    }

                    long elapsed = activeElapsedMs(runId, begin);

                    boolean keep = false;
                    if ("final".equals(type)) {
                        keep = true;
                    } else if (keptCount < 3000) {
                        if (firstWorkerEvent) {
                            keep = true;
                        } else if (score != null && (lastKeptScore == null || score < lastKeptScore)) {
                            keep = true;
                        } else if (lastKeptElapsedMs != null && (elapsed - lastKeptElapsedMs >= 1000)) {
                            keep = true;
                        }
                    }

                    if (firstWorkerEvent) {
                        firstWorkerEvent = false;
                    }

                    if (keep) {
                        keptCount++;
                        if (score != null && (lastKeptScore == null || score < lastKeptScore)) {
                            lastKeptScore = score;
                        }
                        lastKeptElapsedMs = elapsed;

                        Map<String, Object> payloadMap = new LinkedHashMap<>();
                        if (stats != null) {
                            payloadMap.put("stats", stats);
                        }
                        if (progress != null) {
                            payloadMap.put("progress", progress);
                        }
                        if (compute != null) {
                            payloadMap.put("computeMs", compute);
                        }

                        RunEvent runEvent = new RunEvent();
                        runEvent.setRunId(runId);
                        runEvent.setEventTime(Instant.now());
                        runEvent.setIteration(iteration);
                        runEvent.setCurrentScore(score);
                        runEvent.setElapsedMs(elapsed);
                        runEvent.setEventType(type);
                        runEvent.setPayload(payloadMap.isEmpty() ? null : payloadMap);
                        runEvent = runEventRepository.save(runEvent);

                        send(raceId, new RunProgressEvent(runEvent.getId(), runId, code, type, iteration, score,
                                elapsed, compute, progress, stats));
                    }
                }
            }

            int exitCode = process.waitFor();
            watchdog.interrupt();

            if (timedOut.get()) {
                run.setStatus("timed_out");
                run.setFinalScore(lastScore);
                run.setIterations(lastIteration);
                long elapsed = activeElapsedMs(runId, begin);
                run.setRuntimeMs(elapsed);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(lastIteration);
                event.setCurrentScore(lastScore);
                event.setElapsedMs(elapsed);
                event.setEventType("timed_out");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "timed_out", lastIteration, lastScore,
                        elapsed, null, null, null));
            } else if (cancelledRaces.contains(raceId) && !sawFinal) {
                run.setStatus("cancelled");
                run.setFinalScore(lastScore);
                run.setIterations(lastIteration);
                long elapsed = activeElapsedMs(runId, begin);
                run.setRuntimeMs(elapsed);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(lastIteration);
                event.setCurrentScore(lastScore);
                event.setElapsedMs(elapsed);
                event.setEventType("cancelled");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "cancelled", lastIteration, lastScore,
                        elapsed, null, null, null));
            } else if (exitCode != 0 || !sawFinal) {
                run.setStatus("failed");
                long elapsed = activeElapsedMs(runId, begin);
                run.setRuntimeMs(elapsed);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(lastIteration);
                event.setCurrentScore(lastScore);
                event.setElapsedMs(elapsed);
                event.setEventType("failed");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "failed", lastIteration, lastScore,
                        elapsed, null, null, null));
            } else {
                run.setStatus("completed");
                run.setFinalScore(finalScore);
                run.setIterations(finalIteration);
                RunPauseState pauseState = pauseStates.get(runId);
                long totalPaused = pauseState != null ? pauseState.totalPausedMs.get() : 0L;
                long comp = computeMs != null ? Math.round(computeMs) : activeElapsedMs(runId, begin);
                run.setRuntimeMs(Math.max(0L, comp - totalPaused));
                run.setResultOutput(finalPayload);
            }
        } catch (Exception e) {
            failure = e.getMessage();
            long elapsed = activeElapsedMs(runId, begin);
            if (cancelledRaces.contains(raceId) && !sawFinal) {
                run.setStatus("cancelled");
                run.setFinalScore(lastScore);
                run.setIterations(lastIteration);
                run.setRuntimeMs(elapsed);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(lastIteration);
                event.setCurrentScore(lastScore);
                event.setElapsedMs(elapsed);
                event.setEventType("cancelled");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "cancelled", lastIteration, lastScore,
                        elapsed, null, null, null));
            } else {
                run.setStatus("failed");
                run.setRuntimeMs(elapsed);
                RunEvent event = new RunEvent();
                event.setRunId(runId);
                event.setEventTime(Instant.now());
                event.setIteration(lastIteration);
                event.setCurrentScore(lastScore);
                event.setElapsedMs(elapsed);
                event.setEventType("failed");
                event = runEventRepository.save(event);
                send(raceId, new RunProgressEvent(event.getId(), runId, code, "failed", lastIteration, lastScore,
                        elapsed, null, null, null));
            }
        } finally {
            RunPauseState state = pauseStates.get(runId);
            if (state != null) {
                long total = state.totalPausedMs.get();
                long current = state.pausedSince > 0L ? System.currentTimeMillis() - state.pausedSince : 0L;
                run.setPausedMs(total + current);
            }
            pauseStates.remove(runId);
            runningContainers.remove(runId);
            run.setCompletedAt(Instant.now());
            runRepository.save(run);
            if (inputFile != null) {
                inputFile.toFile().delete();
            }
            closeRaceIfDone(raceId);
        }
    }

    private synchronized void closeRaceIfDone(Long raceId) {
        long open = runRepository.countByRaceIdAndStatusIn(raceId, List.of("queued", "running"));
        if (open > 0) {
            return;
        }
        Race race = raceRepository.findById(raceId).orElse(null);
        if (race == null || "completed".equals(race.getStatus()) || "cancelled".equals(race.getStatus())) {
            return;
        }
        if (race.getPausedAt() != null) {
            long pausedDuration = Duration.between(race.getPausedAt(), Instant.now()).toMillis();
            race.setPausedTotalMs(race.getPausedTotalMs() + pausedDuration);
            race.setPausedAt(null);
        }
        pausedRaces.remove(raceId);
        if (cancelledRaces.contains(raceId)) {
            race.setStatus("cancelled");
            race.setCompletedAt(Instant.now());
            raceRepository.save(race);
            send(raceId, new RunProgressEvent(null, null, null, "race_cancelled", null, null, null, null, null, null));
            cancelledRaces.remove(raceId);
        } else {
            race.setStatus("completed");
            race.setCompletedAt(Instant.now());
            raceRepository.save(race);
            send(raceId, new RunProgressEvent(null, null, null, "race_completed", null, null, null, null, null, null));
        }
    }

    private void send(Long raceId, RunProgressEvent event) {
        messagingTemplate.convertAndSend("/topic/race/" + raceId, event);
    }
}
