package com.algoarena.execution;

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
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ExecutionService {

    private final RunRepository runRepository;
    private final RaceRepository raceRepository;
    private final RunEventRepository runEventRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<Long, String> runningContainers = new ConcurrentHashMap<>();
    private final Set<Long> cancelledRaces = ConcurrentHashMap.newKeySet();

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

    public void cancelRace(Long raceId) {
        cancelledRaces.add(raceId);
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

        if (cancelledRaces.contains(raceId)) {
            run.setStatus("cancelled");
            run.setCompletedAt(Instant.now());
            runRepository.save(run);
            RunEvent event = new RunEvent();
            event.setRunId(runId);
            event.setEventTime(Instant.now());
            event.setIteration(0);
            event.setCurrentScore(null);
            event.setElapsedMs(0L);
            event.setEventType("cancelled");
            event = runEventRepository.save(event);
            send(raceId, new RunProgressEvent(event.getId(), runId, code, "cancelled", 0, null, 0L, null, null, null));
            closeRaceIfDone(raceId);
            return;
        }

        run.setStatus("running");
        run.setStartedAt(Instant.now());
        runRepository.save(run);

        RunEvent startedEvent = new RunEvent();
        startedEvent.setRunId(runId);
        startedEvent.setEventTime(Instant.now());
        startedEvent.setIteration(0);
        startedEvent.setCurrentScore(null);
        startedEvent.setElapsedMs(0L);
        startedEvent.setEventType("started");
        startedEvent = runEventRepository.save(startedEvent);
        send(raceId, new RunProgressEvent(startedEvent.getId(), runId, code, "started", 0, null, 0L, null, null, null));

        long begin = System.currentTimeMillis();
        Path inputFile = null;
        boolean sawFinal = false;
        Double finalScore = null;
        Integer finalIteration = null;
        Double lastScore = null;
        Integer lastIteration = null;
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
            Process process = builder.start();

            long timeLimit = run.getRace().getTimeLimitSeconds();
            Thread watchdog = new Thread(() -> {
                try {
                    if (!process.waitFor(timeLimit, TimeUnit.SECONDS)) {
                        timedOut.set(true);
                        killContainer(containerName);
                        process.destroyForcibly();
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
                    Integer iteration = event.hasNonNull("iteration") ? event.get("iteration").asInt() : null;
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

                    long elapsed = System.currentTimeMillis() - begin;

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
                run.setRuntimeMs(System.currentTimeMillis() - begin);
                long elapsed = System.currentTimeMillis() - begin;
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
                run.setRuntimeMs(System.currentTimeMillis() - begin);
                long elapsed = System.currentTimeMillis() - begin;
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
                long elapsed = System.currentTimeMillis() - begin;
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
                run.setRuntimeMs(computeMs != null ? Math.round(computeMs) : System.currentTimeMillis() - begin);
                run.setResultOutput(finalPayload);
            }
        } catch (Exception e) {
            failure = e.getMessage();
            long elapsed = System.currentTimeMillis() - begin;
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
        if (cancelledRaces.contains(raceId)) {
            raceRepository.findById(raceId).ifPresent(race -> {
                race.setStatus("cancelled");
                race.setCompletedAt(Instant.now());
                raceRepository.save(race);
            });
            send(raceId, new RunProgressEvent(null, null, null, "race_cancelled", null, null, null, null, null, null));
            cancelledRaces.remove(raceId);
        } else {
            raceRepository.findById(raceId).ifPresent(race -> {
                race.setStatus("completed");
                race.setCompletedAt(Instant.now());
                raceRepository.save(race);
            });
            send(raceId, new RunProgressEvent(null, null, null, "race_completed", null, null, null, null, null, null));
        }
    }

    private void killContainer(String name) {
        try {
            new ProcessBuilder("docker", "rm", "-f", name)
                    .redirectErrorStream(true)
                    .start()
                    .waitFor(10, TimeUnit.SECONDS);
        } catch (Exception ignored) {
        }
    }

    private void send(Long raceId, RunProgressEvent event) {
        messagingTemplate.convertAndSend("/topic/race/" + raceId, event);
    }
}
