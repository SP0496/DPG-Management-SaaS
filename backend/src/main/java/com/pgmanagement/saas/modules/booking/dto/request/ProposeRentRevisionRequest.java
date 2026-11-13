package com.pgmanagement.saas.modules.booking.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProposeRentRevisionRequest {

    @NotNull(message = "Proposed monthly rent is required")
    @DecimalMin(value = "1.00", message = "Proposed rent must be at least 1.00 INR")
    private BigDecimal proposedMonthlyRent;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
}
