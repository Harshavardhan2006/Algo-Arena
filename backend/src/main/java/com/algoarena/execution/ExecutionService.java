package com.algoarena.execution;

import com.algoarena.model.Run;
import com.algoarena.repository.RaceRepository;
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
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ExecutionService {

    private final RunRepository runRepository;
    private final RaceRepository raceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Value("${algoarena.execution.max-runtime-seconds}")
    private long maxRuntimeSeconds;

    @Value("${algoarena.execution.workers-base-path}")
    private String workersBasePath;

    public ExecutionService(RunRepository runRepository, RaceRepository raceRepository,
                            SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.runRepository = runRepository;
        this.raceRepository = raceRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Async("raceExecutor")
    public void executeRun(Long runId) {
        Run run = runRepository.findById(runId).orElseThrow();
        Long raceId = run.getRace().getId();
        String code = run.getAlgorithm().getCode();

        run.setStatus("running");
        run.setStartedAt(Instant.now());
        runRepository.save(run);
        send(raceId, new RunProgressEvent(runId, code, "started", 0, null, 0L, null, null));

        long begin = System.currentTimeMillis();
        Path inputFile = null;
        boolean sawFinal = false;
        Double finalScore = null;
        Integer finalIteration = null;
        Double computeMs = null;
        Map<String, Object> finalPayload = null;
        AtomicBoolean timedOut = new AtomicBoolean(false);
        String failure = null;

        try {
            inputFile = Files.createTempFile("algoarena-", ".json");
            String json = objectMapper.writeValueAsString(run.getRace().getDataset().getRawInput());
            Files.writeString(inputFile, json, StandardCharsets.UTF_8);

            Path entrypoint = Path.of(workersBasePath, run.getAlgorithm().getWorkerEntrypoint())
                    .toAbsolutePath().normalize();
            ProcessBuilder builder = new ProcessBuilder("node", entrypoint.toString(), inputFile.toString());
            builder.redirectErrorStream(true);
            Process process = builder.start();

            Thread watchdog = new Thread(() -> {
                try {
                    if (!process.waitFor(maxRuntimeSeconds, TimeUnit.SECONDS)) {
                        timedOut.set(true);
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
                    JsonNode payload = event.get("payload");

                    if ("final".equals(type)) {
                        sawFinal = true;
                        finalScore = score;
                        finalIteration = iteration;
                        computeMs = compute;
                        if (payload != null) {
                            finalPayload = objectMapper.convertValue(payload, new TypeReference<Map<String, Object>>() {});
                        }
                    }

                    send(raceId, new RunProgressEvent(runId, code, type, iteration, score,
                            System.currentTimeMillis() - begin, compute, payload));
                }
            }

            int exitCode = process.waitFor();
            watchdog.interrupt();

            if (timedOut.get()) {
                run.setStatus("timed_out");
                send(raceId, new RunProgressEvent(runId, code, "timed_out", null, null,
                        System.currentTimeMillis() - begin, null, null));
            } else if (exitCode != 0 || !sawFinal) {
                run.setStatus("failed");
                send(raceId, new RunProgressEvent(runId, code, "failed", null, null,
                        System.currentTimeMillis() - begin, null, null));
            } else {
                run.setStatus("completed");
                run.setFinalScore(finalScore);
                run.setIterations(finalIteration);
                run.setRuntimeMs(computeMs != null ? Math.round(computeMs) : System.currentTimeMillis() - begin);
                run.setResultOutput(finalPayload);
            }
        } catch (Exception e) {
            failure = e.getMessage();
            run.setStatus("failed");
            send(raceId, new RunProgressEvent(runId, code, "failed", null, null,
                    System.currentTimeMillis() - begin, null, failure));
        } finally {
            run.setCompletedAt(Instant.now());
            runRepository.save(run);
            if (inputFile != null) {
                inputFile.toFile().delete();
            }
            closeRaceIfDone(raceId);
        }
    }

    private void closeRaceIfDone(Long raceId) {
        long open = runRepository.countByRaceIdAndStatusIn(raceId, List.of("queued", "running"));
        if (open > 0) {
            return;
        }
        raceRepository.findById(raceId).ifPresent(race -> {
            race.setStatus("completed");
            race.setCompletedAt(Instant.now());
            raceRepository.save(race);
        });
        send(raceId, new RunProgressEvent(null, null, "race_completed", null, null, null, null, null));
    }

    private void send(Long raceId, RunProgressEvent event) {
        messagingTemplate.convertAndSend("/topic/race/" + raceId, event);
    }
}