package com.lms.health;

import com.lms.repository.HealthRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Value("${spring.application.name:edunexus-backend}")
    private String applicationName;

    private static final String APP_VERSION = "1.0.0-phase1";

    private final HealthRepository healthRepository;

    public HealthController(HealthRepository healthRepository) {
        this.healthRepository = healthRepository;
    }

    /**
     * Overall System Health endpoint: checks app state and PostgreSQL database.
     */
    @GetMapping
    public ResponseEntity<HealthResponse> getOverallHealth() {
        boolean dbLive = healthRepository.checkDatabaseLiveness();
        Map<String, Object> components = new HashMap<>();

        components.put("api", Map.of(
            "status", "UP",
            "runtime", System.getProperty("java.version"),
            "jvm", System.getProperty("java.vm.name")
        ));

        components.put("database", Map.of(
            "status", dbLive ? "UP" : "DOWN",
            "type", "PostgreSQL 16",
            "details", healthRepository.getDatabaseMetadata()
        ));

        if (dbLive) {
            return ResponseEntity.ok(HealthResponse.up(applicationName, APP_VERSION, components));
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(HealthResponse.down(applicationName, APP_VERSION, components));
        }
    }

    /**
     * Dedicated Database Connectivity probe endpoint.
     */
    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> getDatabaseHealth() {
        boolean live = healthRepository.checkDatabaseLiveness();
        Map<String, Object> response = new HashMap<>();
        response.put("service", "PostgreSQL");
        response.put("status", live ? "UP" : "DOWN");
        response.put("timestamp", java.time.Instant.now());
        response.put("metadata", healthRepository.getDatabaseMetadata());

        if (live) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * Kubernetes / Docker Liveness probe.
     */
    @GetMapping("/liveness")
    public ResponseEntity<Map<String, String>> getLiveness() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    /**
     * Kubernetes / Docker Readiness probe.
     */
    @GetMapping("/readiness")
    public ResponseEntity<Map<String, String>> getReadiness() {
        boolean dbLive = healthRepository.checkDatabaseLiveness();
        if (dbLive) {
            return ResponseEntity.ok(Map.of("status", "READY"));
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("status", "NOT_READY"));
        }
    }
}
