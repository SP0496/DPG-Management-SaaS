package com.pgmanagement.saas.modules.booking.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateBookingRentRequest {

    @NotNull(message = "Monthly rent amount is required")
    @DecimalMin(value = "0.01", message = "Monthly rent must be positive")
    private BigDecimal agreedMonthlyRent;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
