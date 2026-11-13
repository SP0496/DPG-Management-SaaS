package com.pgmanagement.saas.modules.booking.dto.request;

import com.pgmanagement.saas.modules.booking.entity.DepositStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateBookingRequest {

    @NotNull(message = "Resident user ID is required")
    private UUID residentId;

    @NotNull(message = "Bed ID is required")
    private UUID bedId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Agreed monthly rent is required")
    @DecimalMin(value = "0.01", message = "Agreed monthly rent must be positive")
    private BigDecimal agreedMonthlyRent;

    @DecimalMin(value = "0.00", message = "Security deposit cannot be negative")
    private BigDecimal securityDepositAmount = BigDecimal.ZERO;

    private DepositStatus depositStatus = DepositStatus.PENDING;

    private String notes;
}
