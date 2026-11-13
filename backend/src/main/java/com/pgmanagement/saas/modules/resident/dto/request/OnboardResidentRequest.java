package com.pgmanagement.saas.modules.resident.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OnboardResidentRequest {

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Resident phone number is required")
    @Pattern(regexp = "^(\\+91|91|0)?[6-9]\\d{9}$", message = "Phone number must be a valid Indian +91 mobile number")
    private String phone;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
    private String fullName;

    @Size(max = 120)
    private String emergencyContactName;

    @Pattern(regexp = "^(\\+?[1-9]\\d{7,14})?$", message = "Invalid emergency contact phone format")
    private String emergencyContactPhone;

    @Size(max = 500)
    private String permanentAddress;

    @Size(max = 40)
    private String idProofType;

    @Pattern(regexp = "^([A-Za-z0-9]{4})?$", message = "ID proof last 4 must be 4 alphanumeric characters")
    private String idProofLast4;

    @Size(max = 120)
    private String occupation;
}
