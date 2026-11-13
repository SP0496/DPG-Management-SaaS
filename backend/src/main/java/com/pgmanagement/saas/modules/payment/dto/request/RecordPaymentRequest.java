package com.pgmanagement.saas.modules.payment.dto.request;

import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class RecordPaymentRequest {

    @NotNull(message = "Invoice ID is required")
    private UUID invoiceId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be positive")
    private BigDecimal amount;

    @Size(max = 120, message = "Idempotency key cannot exceed 120 characters")
    private String idempotencyKey;

    @Size(max = 120, message = "Reference number cannot exceed 120 characters")
    private String referenceNumber;

    private String notes;
}
