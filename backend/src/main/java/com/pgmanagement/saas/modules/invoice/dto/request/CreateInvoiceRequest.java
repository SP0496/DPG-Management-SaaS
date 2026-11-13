package com.pgmanagement.saas.modules.invoice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateInvoiceRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotNull(message = "Billing month is required")
    private LocalDate billingMonth;

    @DecimalMin(value = "0.01", message = "Base rent must be positive")
    private BigDecimal baseRent;

    @DecimalMin(value = "0.00", message = "Utility charges cannot be negative")
    private BigDecimal utilityCharges = BigDecimal.ZERO;

    @DecimalMin(value = "0.00", message = "Penalty fee cannot be negative")
    private BigDecimal penaltyFee = BigDecimal.ZERO;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String notes;
}
