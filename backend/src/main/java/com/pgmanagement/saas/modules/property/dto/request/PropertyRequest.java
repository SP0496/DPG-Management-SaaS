package com.pgmanagement.saas.modules.property.dto.request;

import com.pgmanagement.saas.modules.property.entity.PropertyType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PropertyRequest {

    @NotBlank(message = "Property name is required")
    @Size(min = 2, max = 150, message = "Property name must be between 2 and 150 characters")
    private String name;

    @NotNull(message = "Property type is required")
    private PropertyType propertyType;

    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100)
    private String state;

    @NotBlank(message = "Postal code is required")
    @Size(max = 20)
    private String postalCode;

    @NotBlank(message = "Emergency contact is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{7,14}$", message = "Invalid emergency contact phone format")
    private String emergencyContact;

    @Min(value = 1, message = "Billing day must be between 1 and 28")
    @Max(value = 28, message = "Billing day must be between 1 and 28")
    private Integer defaultBillingDay = 1;

    @Min(value = 0, message = "Grace period cannot be negative")
    @Max(value = 30, message = "Grace period cannot exceed 30 days")
    private Integer gracePeriodDays = 5;

    @DecimalMin(value = "0.00", message = "Late fee cannot be negative")
    private BigDecimal lateFeeAmount = BigDecimal.ZERO;

    private String amenities;
}
