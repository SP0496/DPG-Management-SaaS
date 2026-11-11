package com.pgmanagement.saas.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantOnboardRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 75, message = "First name must be between 2 and 75 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 75, message = "Last name must be between 2 and 75 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number must be a valid phone number")
    private String phone;

    @NotNull(message = "Bed ID is required")
    private UUID bedId;

    @NotNull(message = "Check-in date is required")
    @FutureOrPresent(message = "Check-in date cannot be in the past")
    private LocalDate checkInDate;

    @NotNull(message = "Monthly rent is required")
    @DecimalMin(value = "0.01", message = "Monthly rent must be greater than 0")
    private BigDecimal monthlyRent;

    @NotNull(message = "Security deposit is required")
    @DecimalMin(value = "0.00", message = "Security deposit cannot be negative")
    private BigDecimal securityDeposit;
}
