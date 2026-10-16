package com.lms.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
public class HealthRepository {

    private final JdbcTemplate jdbcTemplate;

    public HealthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Executes SELECT 1 query to verify active connectivity to PostgreSQL.
     */
    public boolean checkDatabaseLiveness() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return result != null && result == 1;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Retrieves database version and current system timestamp from PostgreSQL.
     */
    public Map<String, Object> getDatabaseMetadata() {
        Map<String, Object> meta = new HashMap<>();
        try {
            String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
            meta.put("version", version);
            meta.put("connected", true);

            // Check if Flyway schema history table exists
            Integer flywayMigrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'flyway_schema_history'",
                Integer.class
            );
            meta.put("flywayInstalled", flywayMigrations != null && flywayMigrations > 0);

            // Check active tables count
            Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
                Integer.class
            );
            meta.put("publicTableCount", tableCount != null ? tableCount : 0);

        } catch (Exception e) {
            meta.put("connected", false);
            meta.put("error", e.getMessage());
        }
        return meta;
    }
}
