package com.algoarena.controller;

import com.algoarena.model.Race;
import com.algoarena.model.Run;
import com.algoarena.repository.RaceRepository;
import com.algoarena.repository.RunRepository;
import com.algoarena.service.RaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;
    private final RaceRepository raceRepository;
    private final RunRepository runRepository;

    public RaceController(RaceService raceService, RaceRepository raceRepository, RunRepository runRepository) {
        this.raceService = raceService;
        this.raceRepository = raceRepository;
        this.runRepository = runRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestParam Long datasetId, Authentication auth) {
        return raceService.create(datasetId, auth.getName())
                .<ResponseEntity<?>>map(race -> ResponseEntity.ok(Map.of(
                        "raceId", race.getId(),
                        "status", race.getStatus(),
                        "algorithms", runRepository.findByRaceId(race.getId()).stream()
                                .map(run -> run.getAlgorithm().getCode()).toList())))
                .orElseGet(() -> ResponseEntity.badRequest().body("dataset not found: " + datasetId));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id) {
        Race race = raceRepository.findById(id).orElse(null);
        if (race == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"pending".equals(race.getStatus())) {
            return ResponseEntity.status(409).body("race already started");
        }
        raceService.start(race);
        return ResponseEntity.ok(Map.of("raceId", id, "status", "running"));
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
}