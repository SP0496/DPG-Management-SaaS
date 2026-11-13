package com.pgmanagement.saas.modules.users.controller;

import com.pgmanagement.saas.modules.users.dto.request.UpdateUserRequest;
import com.pgmanagement.saas.modules.users.dto.response.UserResponse;
import com.pgmanagement.saas.modules.users.service.UserService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Authenticated user account endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user account details")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(TenantContext.currentUserId())));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user display name or phone number")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse updated = userService.updateProfile(TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User profile updated"));
    }
}
