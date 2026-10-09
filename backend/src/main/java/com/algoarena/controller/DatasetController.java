package com.algoarena.controller;

import com.algoarena.dto.DatasetUploadRequest;
import com.algoarena.model.Dataset;
import com.algoarena.model.ProblemType;
import com.algoarena.repository.DatasetRepository;
import com.algoarena.repository.ProblemTypeRepository;
import com.algoarena.repository.UserRepository;
import com.algoarena.service.InputValidator;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetRepository datasetRepository;
    private final ProblemTypeRepository problemTypeRepository;
    private final UserRepository userRepository;
    private final InputValidator inputValidator;

    public DatasetController(DatasetRepository datasetRepository, ProblemTypeRepository problemTypeRepository,
                             UserRepository userRepository, InputValidator inputValidator) {
        this.datasetRepository = datasetRepository;
        this.problemTypeRepository = problemTypeRepository;
        this.userRepository = userRepository;
        this.inputValidator = inputValidator;
    }

    @PostMapping
    public ResponseEntity<?> upload(@Valid @RequestBody DatasetUploadRequest request, Authentication auth) {
        ProblemType problemType = problemTypeRepository.findByCode(request.getProblemTypeCode());
        if (problemType == null) {
            return ResponseEntity.badRequest().body("unknown problem type: " + request.getProblemTypeCode());
        }

        String problem = inputValidator.validate(problemType.getCode(), request.getRawInput());
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }

        Dataset dataset = new Dataset();
        dataset.setOwner(userRepository.findByUsername(auth.getName()).orElse(null));
        dataset.setProblemType(problemType);
        dataset.setName(request.getName());
        dataset.setRawInput(request.getRawInput());
        dataset.setSizeMetric(request.getSizeMetric());

        return ResponseEntity.ok(datasetRepository.save(dataset));
    }

    @GetMapping
    public List<Dataset> list() {
        return datasetRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return datasetRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}