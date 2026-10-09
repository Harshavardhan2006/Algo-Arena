package com.algoarena.service;

import com.algoarena.execution.ExecutionService;
import com.algoarena.model.Algorithm;
import com.algoarena.model.Dataset;
import com.algoarena.model.Race;
import com.algoarena.model.Run;
import com.algoarena.repository.AlgorithmRepository;
import com.algoarena.repository.DatasetRepository;
import com.algoarena.repository.RaceRepository;
import com.algoarena.repository.RunRepository;
import com.algoarena.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class RaceService {

    private final DatasetRepository datasetRepository;
    private final AlgorithmRepository algorithmRepository;
    private final RaceRepository raceRepository;
    private final RunRepository runRepository;
    private final UserRepository userRepository;
    private final ExecutionService executionService;

    public RaceService(DatasetRepository datasetRepository, AlgorithmRepository algorithmRepository,
                       RaceRepository raceRepository, RunRepository runRepository,
                       UserRepository userRepository, ExecutionService executionService) {
        this.datasetRepository = datasetRepository;
        this.algorithmRepository = algorithmRepository;
        this.raceRepository = raceRepository;
        this.runRepository = runRepository;
        this.userRepository = userRepository;
        this.executionService = executionService;
    }

    public Optional<Race> create(Long datasetId, String username) {
        Optional<Dataset> found = datasetRepository.findById(datasetId);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        Dataset dataset = found.get();

        Race race = new Race();
        race.setDataset(dataset);
        race.setInitiatedBy(userRepository.findByUsername(username).orElse(null));
        race = raceRepository.save(race);

        List<Algorithm> algorithms = algorithmRepository.findByProblemTypeId(dataset.getProblemType().getId());
        for (Algorithm algorithm : algorithms) {
            Run run = new Run();
            run.setRace(race);
            run.setAlgorithm(algorithm);
            runRepository.save(run);
        }
        return Optional.of(race);
    }

    public void start(Race race) {
        race.setStatus("running");
        race.setStartedAt(Instant.now());
        raceRepository.save(race);
        for (Run run : runRepository.findByRaceId(race.getId())) {
            executionService.executeRun(run.getId());
        }
    }
}