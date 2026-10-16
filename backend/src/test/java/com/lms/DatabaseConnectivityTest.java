package com.lms;

import com.lms.repository.HealthRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase
class DatabaseConnectivityTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private HealthRepository healthRepository;

    @Test
    @DisplayName("Verify active database connection via SELECT 1 probe")
    void testDatabaseLivenessProbe() {
        boolean isLive = healthRepository.checkDatabaseLiveness();
        assertThat(isLive).isTrue();

        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assertThat(result).isEqualTo(1);
    }

    @Test
    @DisplayName("Verify database metadata retrieval")
    void testDatabaseMetadata() {
        Map<String, Object> metadata = healthRepository.getDatabaseMetadata();
        assertThat(metadata).isNotNull();
        assertThat(metadata.get("connected")).isEqualTo(true);
    }
}
