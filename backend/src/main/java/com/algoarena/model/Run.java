package com.algoarena.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "runs")
public class Run {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne
    @JoinColumn(name = "algorithm_id", nullable = false)
    private Algorithm algorithm;

    @Column(nullable = false)
    private String status = "queued";

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "runtime_ms")
    private Long runtimeMs;

    @Column(name = "peak_memory_kb")
    private Long peakMemoryKb;

    private Integer iterations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_output")
    private Map<String, Object> resultOutput;

    public Long getId() { return id; }
    public Race getRace() { return race; }
    public void setRace(Race race) { this.race = race; }
    public Algorithm getAlgorithm() { return algorithm; }
    public void setAlgorithm(Algorithm algorithm) { this.algorithm = algorithm; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Double getFinalScore() { return finalScore; }
    public void setFinalScore(Double finalScore) { this.finalScore = finalScore; }
    public Long getRuntimeMs() { return runtimeMs; }
    public void setRuntimeMs(Long runtimeMs) { this.runtimeMs = runtimeMs; }
    public Long getPeakMemoryKb() { return peakMemoryKb; }
    public void setPeakMemoryKb(Long peakMemoryKb) { this.peakMemoryKb = peakMemoryKb; }
    public Integer getIterations() { return iterations; }
    public void setIterations(Integer iterations) { this.iterations = iterations; }
    public Map<String, Object> getResultOutput() { return resultOutput; }
    public void setResultOutput(Map<String, Object> resultOutput) { this.resultOutput = resultOutput; }
}