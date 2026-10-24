package com.algoarena.execution;

public record RunProgressEvent(
        Long eventId,
        Long runId,
        String algorithmCode,
        String type,
        Long iteration,
        Double score,
        Long elapsedMs,
        Double computeMs,
        Double progress,
        Object stats) {
}
