package com.algoarena.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Entity
@Table(name = "datasets")
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne
    @JoinColumn(name = "problem_type_id", nullable = false)
    private ProblemType problemType;

    @Column(nullable = false)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_input", nullable = false)
    private Map<String, Object> rawInput;

    @Column(name = "size_metric")
    private Integer sizeMetric;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public ProblemType getProblemType() { return problemType; }
    public void setProblemType(ProblemType problemType) { this.problemType = problemType; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Map<String, Object> getRawInput() { return rawInput; }
    public void setRawInput(Map<String, Object> rawInput) { this.rawInput = rawInput; }
    public Integer getSizeMetric() { return sizeMetric; }
    public void setSizeMetric(Integer sizeMetric) { this.sizeMetric = sizeMetric; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public Instant getCreatedAt() { return createdAt; }
}