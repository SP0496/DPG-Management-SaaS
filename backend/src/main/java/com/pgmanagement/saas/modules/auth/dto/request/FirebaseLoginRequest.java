package com.pgmanagement.saas.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FirebaseLoginRequest {

    @NotBlank(message = "Firebase ID token is required")
    private String firebaseIdToken;

    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @Size(max = 128, message = "Invite code must not exceed 128 characters")
    private String inviteCode;
}
