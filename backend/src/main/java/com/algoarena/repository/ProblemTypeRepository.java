package com.algoarena.repository;

import com.algoarena.model.ProblemType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemTypeRepository extends JpaRepository<ProblemType, Long> {
    ProblemType findByCode(String code);
}