package com.algoarena.repository;

import com.algoarena.model.RunEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RunEventRepository extends JpaRepository<RunEvent, Long> {
    List<RunEvent> findByRunIdInOrderByIdAsc(Collection<Long> runIds);
    List<RunEvent> findByRunIdInAndIdGreaterThanOrderByIdAsc(Collection<Long> runIds, Long afterId);
}
