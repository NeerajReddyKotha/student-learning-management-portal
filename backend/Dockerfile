# ==============================================================================
# Multi-stage Dockerfile for Spring Boot 3 & Java 21 LMS Backend
# ==============================================================================

# Stage 1: Build application using Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom.xml first for efficient dependency layer caching
COPY pom.xml .
# Copy source code
COPY src ./src

# Package application, skipping tests in build image (tests run in CI/CD pipeline)
# If maven is installed or using mvnw:
RUN apk add --no-cache maven && mvn clean package -DskipTests

# Stage 2: Runtime image using lightweight JRE 21 Alpine
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl tzdata

# Create dedicated unprivileged user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
