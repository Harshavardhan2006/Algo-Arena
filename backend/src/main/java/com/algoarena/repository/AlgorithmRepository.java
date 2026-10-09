package com.algoarena.repository;

import com.algoarena.model.Algorithm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlgorithmRepository extends JpaRepository<Algorithm, Long> {
    List<Algorithm> findByProblemTypeId(Long problemTypeId);
}