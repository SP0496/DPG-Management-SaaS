package com.pgmanagement.saas.shared.controller;

import com.pgmanagement.saas.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Public liveness probe endpoint")
public class HealthController {

    @GetMapping
    @Operation(summary = "Service health check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "status", "UP",
                        "service", "pg-management-saas-backend",
                        "timestamp", Instant.now().toString()
                ),
                "Service is healthy"
        ));
    }
}
