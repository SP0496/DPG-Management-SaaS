package com.pgmanagement.saas.modules.resident.dto.response;

import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ResidentAssignedRoomResponse {

    private UUID bookingId;
    private UUID propertyId;
    private String propertyName;
    private String propertyAddress;
    private String propertyEmergencyContact;
    private String propertyAmenities;
    private Integer defaultBillingDay;
    private Integer gracePeriodDays;
    private BigDecimal lateFeeAmount;
    private String ownerBusinessName;
    private String ownerPhone;
    private UUID roomId;
    private String roomNumber;
    private Integer floorNumber;
    private String roomType;
    private Boolean hasAttachedBathroom;
    private Boolean hasBalcony;
    private UUID bedId;
    private String bedNumber;
    private BookingStatus bookingStatus;
    private LocalDate checkInDate;
    private LocalDate expectedCheckOutDate;
    private LocalDate nextDueDate;
    private BigDecimal agreedMonthlyRent;
    private BigDecimal securityDepositAmount;
}
