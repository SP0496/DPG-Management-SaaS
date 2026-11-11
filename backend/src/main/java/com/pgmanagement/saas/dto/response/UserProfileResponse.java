package com.pgmanagement.saas.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private UUID organizationId;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String role;
    private boolean verified;
}
