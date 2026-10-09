package com.algoarena.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class InputValidator {

    public String validate(String problemCode, Map<String, Object> input) {
        if ("scheduling".equals(problemCode)) {
            return validateScheduling(input);
        }
        return null;
    }

    private String validateScheduling(Map<String, Object> input) {
        Object machines = input.get("machineCount");
        if (!(machines instanceof Number count) || count.intValue() < 1) {
            return "machineCount must be a number of at least 1";
        }

        Object jobs = input.get("jobs");
        if (!(jobs instanceof List<?> list) || list.isEmpty()) {
            return "jobs must be a non-empty array";
        }
        if (list.size() > 200) {
            return "at most 200 jobs are allowed";
        }

        for (Object entry : list) {
            if (!(entry instanceof Map<?, ?> job)) {
                return "each job must be an object with id and duration";
            }
            if (!(job.get("id") instanceof Number)) {
                return "each job needs a numeric id";
            }
            if (!(job.get("duration") instanceof Number duration) || duration.doubleValue() <= 0) {
                return "each job needs a positive duration";
            }
        }
        return null;
    }
}