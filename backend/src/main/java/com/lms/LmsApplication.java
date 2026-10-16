package com.lms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

import java.net.InetAddress;
import java.net.UnknownHostException;

@SpringBootApplication
public class LmsApplication {

    private static final Logger log = LoggerFactory.getLogger(LmsApplication.class);

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(LmsApplication.class);
        Environment env = app.run(args).getEnvironment();
        logApplicationStartup(env);
    }

    private static void logApplicationStartup(Environment env) {
        String protocol = "http";
        String serverPort = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "/");
        String hostAddress = "localhost";
        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("The host name could not be determined, using `localhost` as fallback");
        }
        log.info("""
            ----------------------------------------------------------
            Application '{}' is running! Access URLs:
            Local:      {}://localhost:{}{}
            External:   {}://{}:{}{}
            Health:     {}://localhost:{}{}/api/v1/health
            Actuator:   {}://localhost:{}{}/actuator
            Profile(s): {}
            ----------------------------------------------------------""",
            env.getProperty("spring.application.name", "lms-backend"),
            protocol, serverPort, contextPath,
            protocol, hostAddress, serverPort, contextPath,
            protocol, serverPort, contextPath,
            protocol, serverPort, contextPath,
            env.getActiveProfiles().length == 0 ? "default" : String.join(", ", env.getActiveProfiles())
        );
    }
}
