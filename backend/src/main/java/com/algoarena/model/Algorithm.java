package com.algoarena.model;

import jakarta.persistence.*;

@Entity
@Table(name = "algorithms")
public class Algorithm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "problem_type_id", nullable = false)
    private ProblemType problemType;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String paradigm;

    @Column(name = "worker_entrypoint", nullable = false)
    private String workerEntrypoint;

    public Long getId() { return id; }
    public ProblemType getProblemType() { return problemType; }
    public void setProblemType(ProblemType problemType) { this.problemType = problemType; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getParadigm() { return paradigm; }
    public void setParadigm(String paradigm) { this.paradigm = paradigm; }
    public String getWorkerEntrypoint() { return workerEntrypoint; }
    public void setWorkerEntrypoint(String workerEntrypoint) { this.workerEntrypoint = workerEntrypoint; }
}