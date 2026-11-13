package com.pgmanagement.saas.modules.payment.dto.request;

import com.pgmanagement.saas.modules.payment.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class SubmitDirectPaymentRequest {

    @NotNull(message = "Invoice ID is required")
    private UUID invoiceId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @DecimalMin(value = "1.00", message = "Payment amount must be at least 1.00 INR")
    private BigDecimal amount;

    @NotBlank(message = "UTR / transaction reference number is required")
    @Size(min = 4, max = 120, message = "UTR reference must be between 4 and 120 characters")
    private String utrReference;

    @Size(max = 120, message = "Payer UPI ID cannot exceed 120 characters")
    private String payerUpiId;

    @Size(max = 150, message = "Payer name cannot exceed 150 characters")
    private String payerName;

    @Size(max = 120, message = "Bank name cannot exceed 120 characters")
    private String bankName;

    private LocalDate paymentDate;

    @NotBlank(message = "Idempotency key is required")
    @Size(max = 120, message = "Idempotency key cannot exceed 120 characters")
    private String idempotencyKey;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
