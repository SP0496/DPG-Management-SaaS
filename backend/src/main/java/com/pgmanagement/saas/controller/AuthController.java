package com.pgmanagement.saas.controller;

import com.pgmanagement.saas.dto.request.LoginRequest;
import com.pgmanagement.saas.dto.request.RegisterRequest;
import com.pgmanagement.saas.dto.response.ApiResponse;
import com.pgmanagement.saas.dto.response.AuthResponse;
import com.pgmanagement.saas.dto.response.UserProfileResponse;
import com.pgmanagement.saas.security.UserPrincipal;
import com.pgmanagement.saas.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Account and organization registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Authentication successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        UserProfileResponse profile = authService.getCurrentUserProfile(principal);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
