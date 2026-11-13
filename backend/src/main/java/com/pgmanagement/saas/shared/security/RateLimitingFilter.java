package com.pgmanagement.saas.shared.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token bucket rate limiter powered by Bucket4j.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final int authPerMinute;
    private final int generalPerMinute;

    public RateLimitingFilter(
            @Value("${app.security.rate-limit.auth-per-minute:10}") int authPerMinute,
            @Value("${app.security.rate-limit.general-per-minute:120}") int generalPerMinute) {
        this.authPerMinute = authPerMinute;
        this.generalPerMinute = generalPerMinute;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/health")
                || path.startsWith("/actuator/health")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        String clientIp = request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";

        boolean isAuthRoute = path.startsWith("/auth/");
        Bucket bucket = isAuthRoute
                ? authBuckets.computeIfAbsent(clientIp, k -> createBucket(authPerMinute))
                : generalBuckets.computeIfAbsent(clientIp, k -> createBucket(generalPerMinute));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);
        response.setHeader("Retry-After", "60");
        SecurityResponseWriter.writeError(
                request,
                response,
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                "Rate limit exceeded. Please wait 60 seconds before retrying."
        );
    }

    private Bucket createBucket(int capacityPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacityPerMinute)
                .refillIntervally(capacityPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
