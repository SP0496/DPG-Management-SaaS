package com.pgmanagement.saas.modules.resident.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertResidentProfileRequest {

    @Size(max = 120, message = "Emergency contact name cannot exceed 120 characters")
    private String emergencyContactName;

    @Pattern(regexp = "^(\\+?[1-9]\\d{7,14})?$", message = "Invalid emergency contact phone format")
    private String emergencyContactPhone;

    @Size(max = 500, message = "Permanent address cannot exceed 500 characters")
    private String permanentAddress;

    @Size(max = 40, message = "ID proof type cannot exceed 40 characters")
    private String idProofType;

    @Pattern(regexp = "^([A-Za-z0-9]{4})?$", message = "ID proof last 4 must be 4 alphanumeric characters")
    private String idProofLast4;

    @Size(max = 120, message = "Occupation cannot exceed 120 characters")
    private String occupation;
}
