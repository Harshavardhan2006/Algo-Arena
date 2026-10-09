package com.algoarena.config;

import com.algoarena.model.Algorithm;
import com.algoarena.model.ProblemType;
import com.algoarena.repository.AlgorithmRepository;
import com.algoarena.repository.ProblemTypeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ProblemTypeRepository problemTypeRepository;
    private final AlgorithmRepository algorithmRepository;

    public DataSeeder(ProblemTypeRepository problemTypeRepository, AlgorithmRepository algorithmRepository) {
        this.problemTypeRepository = problemTypeRepository;
        this.algorithmRepository = algorithmRepository;
    }

    @Override
    public void run(String... args) {
        ProblemType scheduling = problemTypeRepository.findByCode("scheduling");
        if (scheduling == null) {
            scheduling = new ProblemType();
            scheduling.setCode("scheduling");
            scheduling.setName("Job Scheduling");
            scheduling.setScoringFunction("makespan");
            scheduling.setInputSchema(Map.of(
                    "jobs", "array of {id, duration}",
                    "machineCount", "integer"
            ));
            scheduling = problemTypeRepository.save(scheduling);
        }

        seedAlgorithm(scheduling, "greedy", "Greedy (Shortest Job First)", "greedy", "scheduling/greedy.js");
        seedAlgorithm(scheduling, "branch_and_bound", "Branch and Bound (Optimal)", "exact", "scheduling/branch_and_bound.js");
    }

    private void seedAlgorithm(ProblemType problemType, String code, String name, String paradigm, String entrypoint) {
        boolean exists = algorithmRepository.findByProblemTypeId(problemType.getId()).stream()
                .anyMatch(a -> a.getCode().equals(code));
        if (exists) return;

        Algorithm algorithm = new Algorithm();
        algorithm.setProblemType(problemType);
        algorithm.setCode(code);
        algorithm.setName(name);
        algorithm.setParadigm(paradigm);
        algorithm.setWorkerEntrypoint(entrypoint);
        algorithmRepository.save(algorithm);
    }
}