package com.lms;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class LmsApplicationStartupTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Application context starts up successfully without errors")
    void contextLoads() {
        assertThat(applicationContext).isNotNull();
        assertThat(applicationContext.containsBean("lmsApplication")).isTrue();
        assertThat(applicationContext.containsBean("healthController")).isTrue();
        assertThat(applicationContext.containsBean("databaseHealthIndicator")).isTrue();
    }
}
