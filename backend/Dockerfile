# ==============================================================================
# Multi-Stage Hardened Dockerfile for PG-Management-SaaS Backend
# Stage 1: Build the artifact
# Stage 2: Minimal Distroless / Alpine JRE with non-root security context
# ==============================================================================

# Build Stage
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace/app

# Pre-fetch dependencies to leverage layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and package
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Create non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Security: Set permissions
COPY --from=builder /workspace/app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose default HTTP port
EXPOSE 8080

# Configure memory limits and JVM hardening flags
ENTRYPOINT ["java", \
    "-XX:+UseG1GC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
