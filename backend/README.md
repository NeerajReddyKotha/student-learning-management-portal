# LMS Backend Service (Spring Boot 3 + Java 21)

This service provides the backend REST APIs, PostgreSQL data persistence, Flyway database schema migrations, and enterprise health checks for the LMS Platform.

## Technology Stack
- **Language**: Java 21 LTS
- **Framework**: Spring Boot 3.3.4
- **ORM / Persistence**: Spring Data JPA / Hibernate 6
- **Database**: PostgreSQL 16
- **Migration Engine**: Flyway 10
- **Monitoring & Health**: Spring Boot Actuator & Custom Health Indicators

## Getting Started

### Prerequisites
- JDK 21 (Eclipse Temurin, Amazon Corretto, or OpenJDK)
- Apache Maven 3.9+ or `./mvnw`
- PostgreSQL 16 instance running on `localhost:5432` (or via Docker Compose)

### Running Locally
```bash
# 1. Start PostgreSQL (e.g., via root docker compose)
docker compose up -d postgres

# 2. Run Spring Boot application
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Health Check Endpoints
- **System Health**: `GET http://localhost:8080/api/v1/health`
- **Database Connectivity**: `GET http://localhost:8080/api/v1/health/db`
- **Spring Actuator**: `GET http://localhost:8080/actuator/health`

### Automated Tests
```bash
# Run unit tests and startup integration test
mvn test
```
