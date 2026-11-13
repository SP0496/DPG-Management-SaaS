package com.pgmanagement.saas.modules.owner.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OwnerDashboardResponse {

    private long totalProperties;
    private long totalRooms;
    private long totalBeds;
    private long occupiedBeds;
    private long vacantBeds;
    private long maintenanceBeds;
    private double occupancyPercentage;
    private long totalResidents;
    private long activeBookings;
    private long noticeGivenCount;
    private long pendingKycCount;
    private long openComplaintsCount;
    private long inProgressComplaintsCount;
    private BigDecimal expectedMonthlyRent;
    private BigDecimal collectedThisMonth;
    private BigDecimal pendingRentTotal;
    private BigDecimal overdueRentTotal;
    private long overdueInvoicesCount;
    private long pendingInvitationsCount;
    private long paidResidentsCount;
    private long pendingResidentsCount;
    private long pendingVerificationCount;
}
