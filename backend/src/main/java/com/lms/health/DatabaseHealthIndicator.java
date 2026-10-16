package com.lms.health;

import com.lms.repository.HealthRepository;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final HealthRepository healthRepository;

    public DatabaseHealthIndicator(HealthRepository healthRepository) {
        this.healthRepository = healthRepository;
    }

    @Override
    public Health health() {
        boolean isLive = healthRepository.checkDatabaseLiveness();
        if (isLive) {
            Map<String, Object> metadata = healthRepository.getDatabaseMetadata();
            return Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetails(metadata)
                .build();
        } else {
            return Health.down()
                .withDetail("database", "PostgreSQL")
                .withDetail("error", "Unable to execute SELECT 1 probe against database")
                .build();
        }
    }
}
