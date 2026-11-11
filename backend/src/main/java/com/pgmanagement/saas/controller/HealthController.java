package com.pgmanagement.saas.controller;

import com.pgmanagement.saas.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public Health & Liveness Probe for Load Balancers and Containers.
 * Masks internal diagnostic details.
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("status", "UP", "service", "PG-Management-SaaS-Backend"),
                "Service is running normally"
        ));
    }
}
