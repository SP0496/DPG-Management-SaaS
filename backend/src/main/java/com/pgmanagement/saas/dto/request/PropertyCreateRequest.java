package com.pgmanagement.saas.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyCreateRequest {

    @NotBlank(message = "Property name is required")
    @Size(min = 3, max = 150, message = "Property name must be between 3 and 150 characters")
    private String name;

    @NotBlank(message = "Property type is required")
    private String propertyType; // e.g. PG_BOYS, PG_GIRLS, PG_COED, HOSTEL

    @NotBlank(message = "Address line is required")
    @Size(max = 255, message = "Address line cannot exceed 255 characters")
    private String addressLine1;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[0-9]{5,10}$", message = "Postal code must be 5-10 digits")
    private String postalCode;

    @NotBlank(message = "Emergency contact is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Emergency contact must be a valid phone number")
    private String emergencyContact;

    private List<String> amenities;
}
