package com.pgmanagement.saas.modules.auth.dto.response;

import com.pgmanagement.saas.modules.users.dto.response.UserResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresInMs;
    private boolean newUser;
    private UserResponse user;
}
