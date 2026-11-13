package com.pgmanagement.saas.modules.booking.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RespondRentRevisionRequest {

    private boolean accept;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;
}
