package com.pgmanagement.saas.modules.booking.dto.response;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import com.pgmanagement.saas.modules.booking.entity.DepositStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class BookingResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private UUID roomId;
    private UUID bedId;
    private UUID residentId;
    private LocalDate checkInDate;
    private LocalDate expectedCheckOutDate;
    private LocalDate actualCheckOutDate;
    private BigDecimal agreedMonthlyRent;
    private BigDecimal securityDepositAmount;
    private DepositStatus depositStatus;
    private BookingStatus status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    public static BookingResponse from(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .ownerId(booking.getOwnerId())
                .propertyId(booking.getPropertyId())
                .roomId(booking.getRoomId())
                .bedId(booking.getBedId())
                .residentId(booking.getResidentId())
                .checkInDate(booking.getCheckInDate())
                .expectedCheckOutDate(booking.getExpectedCheckOutDate())
                .actualCheckOutDate(booking.getActualCheckOutDate())
                .agreedMonthlyRent(booking.getAgreedMonthlyRent())
                .securityDepositAmount(booking.getSecurityDepositAmount())
                .depositStatus(booking.getDepositStatus())
                .status(booking.getStatus())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
