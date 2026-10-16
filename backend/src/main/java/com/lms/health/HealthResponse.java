package com.lms.health;

import java.time.Instant;
import java.util.Map;

public record HealthResponse(
    String status,
    String application,
    String version,
    Instant timestamp,
    Map<String, Object> components
) {
    public static HealthResponse up(String application, String version, Map<String, Object> components) {
        return new HealthResponse("UP", application, version, Instant.now(), components);
    }

    public static HealthResponse down(String application, String version, Map<String, Object> components) {
        return new HealthResponse("DOWN", application, version, Instant.now(), components);
    }
}
