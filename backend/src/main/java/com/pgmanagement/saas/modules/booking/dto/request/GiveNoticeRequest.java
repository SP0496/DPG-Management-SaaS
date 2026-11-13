package com.pgmanagement.saas.modules.booking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GiveNoticeRequest {

    @NotNull(message = "Expected checkout date is required")
    private LocalDate expectedCheckOutDate;

    private String notes;
}
