package com.pgmanagement.saas.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectPaymentSubmissionRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(min = 3, max = 500, message = "Rejection reason must be between 3 and 500 characters")
    private String reason;
}
