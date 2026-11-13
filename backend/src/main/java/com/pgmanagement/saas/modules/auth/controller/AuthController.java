package com.pgmanagement.saas.modules.auth.controller;

import com.pgmanagement.saas.modules.auth.dto.request.FirebaseLoginRequest;
import com.pgmanagement.saas.modules.auth.dto.request.RefreshTokenRequest;
import com.pgmanagement.saas.modules.auth.dto.response.AuthResponse;
import com.pgmanagement.saas.modules.auth.service.AuthService;
import com.pgmanagement.saas.modules.users.dto.response.UserResponse;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Firebase Phone OTP verification, token refresh, logout, and identity endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping({"/firebase/verify", "/otp/verify"})
    @Operation(summary = "Verify a Firebase Phone OTP ID token, resolve PostgreSQL user and role, and issue API JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyFirebaseOtp(@Valid @RequestBody FirebaseLoginRequest request) {
        AuthResponse response = authService.verifyFirebaseLogin(request);
        String message = response.isNewUser() ? "Account provisioned and signed in" : "Signed in successfully";
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue a fresh JWT access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token session")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated account summary")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success(authService.currentUser(TenantContext.currentUserId())));
    }
}
