package com.algoarena.execution;

public record RunProgressEvent(
        Long runId,
        String algorithmCode,
        String type,
        Integer iteration,
        Double score,
        Long elapsedMs,
        Double computeMs,
        Object payload) {
}