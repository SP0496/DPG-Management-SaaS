package com.pgmanagement.saas.modules.booking.dto.response;

import com.pgmanagement.saas.modules.booking.entity.RentRevisionAgreement;
import com.pgmanagement.saas.modules.booking.entity.RentRevisionStatus;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RentRevisionResponse {

    private UUID id;
    private UUID assignmentId;
    private UUID bookingId;
    private UUID ownerId;
    private UUID residentId;
    private BigDecimal previousMonthlyRent;
    private BigDecimal proposedMonthlyRent;
    private long previousRentPaise;
    private long proposedRentPaise;
    private LocalDate effectiveDate;
    private String reason;
    private RentRevisionStatus status;
    private Instant proposedAt;
    private Instant respondedAt;
    private String residentRemarks;

    public static RentRevisionResponse from(RentRevisionAgreement entity) {
        return RentRevisionResponse.builder()
                .id(entity.getId())
                .assignmentId(entity.getAssignmentId())
                .bookingId(entity.getBookingId())
                .ownerId(entity.getOwnerId())
                .residentId(entity.getResidentId())
                .previousMonthlyRent(MoneyUtils.toRupees(entity.getPreviousRentPaise()))
                .proposedMonthlyRent(MoneyUtils.toRupees(entity.getProposedRentPaise()))
                .previousRentPaise(entity.getPreviousRentPaise())
                .proposedRentPaise(entity.getProposedRentPaise())
                .effectiveDate(entity.getEffectiveDate())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .proposedAt(entity.getProposedAt())
                .respondedAt(entity.getRespondedAt())
                .residentRemarks(entity.getResidentRemarks())
                .build();
    }
}
