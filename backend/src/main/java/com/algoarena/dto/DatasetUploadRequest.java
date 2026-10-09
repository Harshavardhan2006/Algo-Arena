package com.algoarena.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class DatasetUploadRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String problemTypeCode;

    @NotNull
    private Map<String, Object> rawInput;

    private Integer sizeMetric;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProblemTypeCode() { return problemTypeCode; }
    public void setProblemTypeCode(String problemTypeCode) { this.problemTypeCode = problemTypeCode; }
    public Map<String, Object> getRawInput() { return rawInput; }
    public void setRawInput(Map<String, Object> rawInput) { this.rawInput = rawInput; }
    public Integer getSizeMetric() { return sizeMetric; }
    public void setSizeMetric(Integer sizeMetric) { this.sizeMetric = sizeMetric; }
}