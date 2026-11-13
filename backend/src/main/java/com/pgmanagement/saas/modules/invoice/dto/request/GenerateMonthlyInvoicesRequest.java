package com.pgmanagement.saas.modules.invoice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class GenerateMonthlyInvoicesRequest {

    @NotNull(message = "Billing month is required")
    private LocalDate billingMonth;

    private UUID propertyId;

    @DecimalMin(value = "0.00", message = "Utility charges cannot be negative")
    private BigDecimal utilityCharges = BigDecimal.ZERO;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
