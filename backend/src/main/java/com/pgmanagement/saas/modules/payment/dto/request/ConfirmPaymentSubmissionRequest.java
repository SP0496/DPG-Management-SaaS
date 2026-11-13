package com.pgmanagement.saas.modules.payment.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConfirmPaymentSubmissionRequest {

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;
}
