package com.pgmanagement.saas.modules.resident.service;

import com.pgmanagement.saas.modules.announcement.dto.response.AnnouncementResponse;
import com.pgmanagement.saas.modules.announcement.service.AnnouncementService;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.complaint.entity.Complaint;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import com.pgmanagement.saas.modules.complaint.repository.ComplaintRepository;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceRepository;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentAssignedRoomResponse;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentDashboardResponse;
import com.pgmanagement.saas.modules.resident.dto.response.ResidentProfileResponse;
import com.pgmanagement.saas.modules.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidentDashboardService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final ResidentService residentService;
    private final BookingService bookingService;
    private final InvoiceRepository invoiceRepository;
    private final ComplaintRepository complaintRepository;
    private final AnnouncementService announcementService;

    @Transactional(readOnly = true)
    public ResidentDashboardResponse getDashboard(UUID residentUserId) {
        ResidentProfileResponse profile = residentService.getMyProfile(residentUserId);
        ResidentAssignedRoomResponse assignedRoom = bookingService.findAssignedRoomOptional(residentUserId).orElse(null);

        LocalDate today = LocalDate.now(INDIA_ZONE);
        int graceDays = assignedRoom != null && assignedRoom.getGracePeriodDays() != null
                ? assignedRoom.getGracePeriodDays()
                : 0;

        List<RentInvoice> invoices = invoiceRepository.findAllByResidentIdOrderByDueDateDesc(residentUserId);
        List<RentInvoice> openInvoices = invoices.stream()
                .filter(inv -> inv.getStatus() != InvoiceStatus.PAID && inv.getStatus() != InvoiceStatus.CANCELLED)
                .toList();

        BigDecimal outstandingBalance = openInvoices.stream()
                .map(this::computeBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<RentInvoice> overdueInvoices = openInvoices.stream()
                .filter(inv -> inv.getStatus() == InvoiceStatus.OVERDUE
                        || inv.getDueDate().plusDays(graceDays).isBefore(today))
                .toList();

        BigDecimal overdueBalance = overdueInvoices.stream()
                .map(this::computeBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        RentInvoice nearestDueInvoice = openInvoices.stream()
                .min(Comparator.comparing(RentInvoice::getDueDate))
                .orElse(null);

        LocalDate nextDueDate = nearestDueInvoice != null
                ? nearestDueInvoice.getDueDate()
                : (assignedRoom != null ? assignedRoom.getNextDueDate() : null);

        if (assignedRoom != null && nearestDueInvoice != null) {
            assignedRoom.setNextDueDate(nearestDueInvoice.getDueDate());
        }

        BigDecimal nextDueAmount = nearestDueInvoice != null
                ? computeBalanceDue(nearestDueInvoice)
                : (assignedRoom != null ? assignedRoom.getAgreedMonthlyRent() : BigDecimal.ZERO);

        List<Complaint> complaints = complaintRepository.findAllByResidentIdOrderByCreatedAtDesc(residentUserId);
        long openComplaintsCount = complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.OPEN || c.getStatus() == ComplaintStatus.IN_PROGRESS)
                .count();
        long resolvedComplaintsCount = complaints.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED || c.getStatus() == ComplaintStatus.CLOSED)
                .count();

        List<AnnouncementResponse> announcements = announcementService.listAnnouncements(residentUserId, Role.RESIDENT);

        return ResidentDashboardResponse.builder()
                .profile(profile)
                .assignedRoom(assignedRoom)
                .outstandingBalance(outstandingBalance)
                .overdueBalance(overdueBalance)
                .overdueInvoicesCount(overdueInvoices.size())
                .pendingInvoicesCount(openInvoices.size())
                .nextDueDate(nextDueDate)
                .nextDueAmount(nextDueAmount)
                .nextDueInvoiceNumber(nearestDueInvoice != null ? nearestDueInvoice.getInvoiceNumber() : null)
                .openComplaintsCount(openComplaintsCount)
                .resolvedComplaintsCount(resolvedComplaintsCount)
                .activeAnnouncementsCount(announcements.size())
                .recentAnnouncements(announcements.stream().limit(3).toList())
                .build();
    }

    private BigDecimal computeBalanceDue(RentInvoice invoice) {
        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal paid = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
        return total.subtract(paid).max(BigDecimal.ZERO);
    }
}
