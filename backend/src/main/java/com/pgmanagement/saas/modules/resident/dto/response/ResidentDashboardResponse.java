package com.pgmanagement.saas.modules.resident.dto.response;

import com.pgmanagement.saas.modules.announcement.dto.response.AnnouncementResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ResidentDashboardResponse {

    private ResidentProfileResponse profile;
    private ResidentAssignedRoomResponse assignedRoom;
    private BigDecimal outstandingBalance;
    private BigDecimal overdueBalance;
    private long overdueInvoicesCount;
    private long pendingInvoicesCount;
    private LocalDate nextDueDate;
    private BigDecimal nextDueAmount;
    private String nextDueInvoiceNumber;
    private long openComplaintsCount;
    private long resolvedComplaintsCount;
    private long activeAnnouncementsCount;
    private List<AnnouncementResponse> recentAnnouncements;
}
