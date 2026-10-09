package com.algoarena.repository;

import com.algoarena.model.Run;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RunRepository extends JpaRepository<Run, Long> {
    List<Run> findByRaceId(Long raceId);
    long countByRaceIdAndStatusIn(Long raceId, Collection<String> statuses);
}