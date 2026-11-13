package com.pgmanagement.saas.modules.resident.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AcceptInvitationRequest {

    @NotBlank(message = "Invitation code is required")
    @Size(max = 128, message = "Invitation code cannot exceed 128 characters")
    private String inviteCode;
}
