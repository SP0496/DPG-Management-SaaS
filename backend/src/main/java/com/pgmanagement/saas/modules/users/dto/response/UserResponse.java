package com.pgmanagement.saas.modules.users.dto.response;

import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String phone;
    private String fullName;
    private Role role;
    private boolean active;
    private Instant lastLoginAt;
    private Instant createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .role(user.getRole())
                .active(user.isActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
