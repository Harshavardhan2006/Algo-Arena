package com.algoarena.controller;

import com.algoarena.execution.ExecutionService;
import com.algoarena.execution.RunProgressEvent;
import com.algoarena.model.Race;
import com.algoarena.model.Run;
import com.algoarena.model.RunEvent;
import com.algoarena.repository.RaceRepository;
import com.algoarena.repository.RunEventRepository;
import com.algoarena.repository.RunRepository;
import com.algoarena.service.RaceService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    public record RaceStateResponse(
            Long raceId,
            String status,
            Instant startedAt,
            Instant completedAt,
            String problemType,
            String datasetName,
            Integer datasetSize,
            Integer timeLimitSeconds,
            List<RunStateResponse> runs) {}

    public record RunStateResponse(
            Long runId,
            String algorithm,
            String name,
            String paradigm,
            String status,
            Double score,
            Long iterations,
            Long elapsedMs,
            Long computeMs,
            Double progress,
            Object stats) {}

    @Value("${algoarena.execution.max-runtime-seconds}")
    private int defaultMaxRuntimeSeconds;

    @Value("${algoarena.execution.max-time-limit-seconds:600}")
    private int maxTimeLimitSeconds;

    private final RaceService raceService;
    private final RaceRepository raceRepository;
    private final RunRepository runRepository;
    private final RunEventRepository runEventRepository;
    private final ExecutionService executionService;

    public RaceController(RaceService raceService, RaceRepository raceRepository,
                          RunRepository runRepository, RunEventRepository runEventRepository,
                          ExecutionService executionService) {
        this.raceService = raceService;
        this.raceRepository = raceRepository;
        this.runRepository = runRepository;
        this.runEventRepository = runEventRepository;
        this.executionService = executionService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestParam Long datasetId,
                                    @RequestParam(required = false) Integer timeLimitSeconds,
                                    Authentication auth) {
        int limit = timeLimitSeconds != null ? timeLimitSeconds : defaultMaxRuntimeSeconds;
        if (limit < 5 || limit > maxTimeLimitSeconds) {
            return ResponseEntity.badRequest().body("timeLimitSeconds must be between 5 and " + maxTimeLimitSeconds);
        }
        return raceService.create(datasetId, auth.getName(), limit)
                .<ResponseEntity<?>>map(race -> ResponseEntity.ok(Map.of(
                        "raceId", race.getId(),
                        "status", race.getStatus(),
                        "algorithms", runRepository.findByRaceId(race.getId()).stream()
                                .map(run -> run.getAlgorithm().getCode()).toList())))
                .orElseGet(() -> ResponseEntity.badRequest().body("dataset not found: " + datasetId));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id, Authentication auth) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }
        if (race.getInitiatedBy() == null || auth == null || !race.getInitiatedBy().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).body("forbidden");
        }
        if (!"pending".equals(race.getStatus())) {
            return ResponseEntity.status(409).body("race already started");
        }
        raceService.start(race);
        return ResponseEntity.ok(Map.of("raceId", id, "status", "running"));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<?> stop(@PathVariable Long id, Authentication auth) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }
        if (race.getInitiatedBy() == null || auth == null || !race.getInitiatedBy().getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).body("forbidden");
        }
        if (!"running".equals(race.getStatus())) {
            return ResponseEntity.status(409).body("race is not running");
        }
        executionService.cancelRace(id);
        return ResponseEntity.ok(Map.of("raceId", id, "status", "cancelling"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> runs = runRepository.findByRaceId(id).stream().map(run -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("algorithm", run.getAlgorithm().getCode());
            view.put("status", run.getStatus());
            view.put("score", run.getFinalScore());
            view.put("runtimeMs", run.getRuntimeMs());
            view.put("iterations", run.getIterations());
            return view;
        }).toList();

        return ResponseEntity.ok(Map.of("raceId", id, "status", race.getStatus(), "runs", runs));
    }

    @GetMapping("/{id}/state")
    public ResponseEntity<?> getState(@PathVariable Long id) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }

        List<Run> runs = runRepository.findByRaceId(id);

        List<RunStateResponse> runResponses = runs.stream().map(run -> {
            RunEvent lastEvent = runEventRepository.findFirstByRunIdOrderByIdDesc(run.getId());
            Double score = run.getFinalScore() != null ? run.getFinalScore()
                    : (lastEvent != null ? lastEvent.getCurrentScore() : null);
            Long iterations = run.getIterations() != null ? run.getIterations()
                    : (lastEvent != null ? lastEvent.getIteration() : null);
            Long elapsedMs = lastEvent != null ? lastEvent.getElapsedMs() : null;
            Long computeMs = run.getRuntimeMs();
            Double progress = null;
            Object stats = null;
            if (lastEvent != null && lastEvent.getPayload() != null) {
                Object pObj = lastEvent.getPayload().get("progress");
                if (pObj instanceof Number n) {
                    progress = n.doubleValue();
                }
                stats = lastEvent.getPayload().get("stats");
            }

            return new RunStateResponse(
                    run.getId(),
                    run.getAlgorithm().getCode(),
                    run.getAlgorithm().getName(),
                    run.getAlgorithm().getParadigm(),
                    run.getStatus(),
                    score,
                    iterations,
                    elapsedMs,
                    computeMs,
                    progress,
                    stats
            );
        }).toList();

        RaceStateResponse response = new RaceStateResponse(
                race.getId(),
                race.getStatus(),
                race.getStartedAt(),
                race.getCompletedAt(),
                race.getDataset().getProblemType().getCode(),
                race.getDataset().getName(),
                race.getDataset().getSizeMetric(),
                race.getTimeLimitSeconds(),
                runResponses
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<?> getEvents(@PathVariable Long id, @RequestParam(name = "after", defaultValue = "0") Long after) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }

        List<Run> runs = runRepository.findByRaceId(id);
        List<Long> runIds = runs.stream().map(Run::getId).toList();
        if (runIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Map<Long, String> algorithmCodes = runs.stream()
                .collect(Collectors.toMap(Run::getId, r -> r.getAlgorithm().getCode()));

        long afterId = after != null ? after : 0L;
        List<RunEvent> events = afterId > 0
                ? runEventRepository.findByRunIdInAndIdGreaterThanOrderByIdAsc(runIds, afterId)
                : runEventRepository.findByRunIdInOrderByIdAsc(runIds);

        List<RunProgressEvent> response = events.stream().map(event -> {
            Double progress = null;
            Object stats = null;
            Double computeMs = null;
            if (event.getPayload() != null) {
                Object pObj = event.getPayload().get("progress");
                if (pObj instanceof Number n) {
                    progress = n.doubleValue();
                }
                stats = event.getPayload().get("stats");
                Object cObj = event.getPayload().get("computeMs");
                if (cObj instanceof Number n) {
                    computeMs = n.doubleValue();
                }
            }
            return new RunProgressEvent(
                    event.getId(),
                    event.getRunId(),
                    algorithmCodes.get(event.getRunId()),
                    event.getEventType(),
                    event.getIteration(),
                    event.getCurrentScore(),
                    event.getElapsedMs(),
                    computeMs,
                    progress,
                    stats
            );
        }).toList();

        return ResponseEntity.ok(response);
    }
}
