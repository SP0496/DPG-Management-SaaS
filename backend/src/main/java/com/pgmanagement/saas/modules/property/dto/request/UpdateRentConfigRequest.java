package com.pgmanagement.saas.modules.property.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateRentConfigRequest {

    @NotNull(message = "Default billing day is required")
    @Min(value = 1, message = "Billing day must be between 1 and 28")
    @Max(value = 28, message = "Billing day must be between 1 and 28")
    private Integer defaultBillingDay;

    @NotNull(message = "Grace period days is required")
    @Min(value = 0, message = "Grace period cannot be negative")
    @Max(value = 30, message = "Grace period cannot exceed 30 days")
    private Integer gracePeriodDays;

    @NotNull(message = "Late fee amount is required")
    @DecimalMin(value = "0.00", message = "Late fee cannot be negative")
    private BigDecimal lateFeeAmount;
}
