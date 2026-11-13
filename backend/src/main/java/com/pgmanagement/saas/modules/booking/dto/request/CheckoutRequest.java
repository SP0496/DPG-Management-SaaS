package com.pgmanagement.saas.modules.booking.dto.request;

import com.pgmanagement.saas.modules.booking.entity.DepositStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CheckoutRequest {

    private LocalDate actualCheckOutDate;

    private DepositStatus depositStatus;

    private String notes;
}
