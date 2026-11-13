package com.pgmanagement.saas.modules.owner.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.entity.BookingStatus;
import com.pgmanagement.saas.modules.booking.repository.BookingRepository;
import com.pgmanagement.saas.modules.complaint.entity.Complaint;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import com.pgmanagement.saas.modules.complaint.repository.ComplaintRepository;
import com.pgmanagement.saas.modules.invoice.entity.InvoiceStatus;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.invoice.repository.InvoiceRepository;
import com.pgmanagement.saas.modules.owner.dto.response.OwnerDashboardResponse;
import com.pgmanagement.saas.modules.payment.entity.Payment;
import com.pgmanagement.saas.modules.payment.entity.PaymentStatus;
import com.pgmanagement.saas.modules.payment.entity.PaymentSubmissionStatus;
import com.pgmanagement.saas.modules.payment.repository.PaymentRepository;
import com.pgmanagement.saas.modules.payment.repository.PaymentSubmissionRepository;
import com.pgmanagement.saas.modules.property.entity.Property;
import com.pgmanagement.saas.modules.property.repository.PropertyRepository;
import com.pgmanagement.saas.modules.resident.entity.InvitationStatus;
import com.pgmanagement.saas.modules.resident.entity.ResidentProfile;
import com.pgmanagement.saas.modules.resident.repository.ResidentInvitationRepository;
import com.pgmanagement.saas.modules.resident.repository.ResidentProfileRepository;
import com.pgmanagement.saas.modules.room.entity.Bed;
import com.pgmanagement.saas.modules.room.entity.BedStatus;
import com.pgmanagement.saas.modules.room.repository.BedRepository;
import com.pgmanagement.saas.modules.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerDashboardService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final ResidentInvitationRepository invitationRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentSubmissionRepository paymentSubmissionRepository;
    private final ComplaintRepository complaintRepository;

    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboardStats(UUID ownerId) {
        List<Property> properties = propertyRepository.findAllByOwnerIdAndActiveTrue(ownerId);
        Map<UUID, Property> propertyMap = properties.stream()
                .collect(Collectors.toMap(Property::getId, Function.identity()));

        long totalRooms = roomRepository.findAllByOwnerIdAndActiveTrue(ownerId).size();

        List<Bed> beds = bedRepository.findAllByOwnerId(ownerId);
        long totalBeds = beds.size();
        long occupiedBeds = beds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
        long vacantBeds = beds.stream().filter(b -> b.getStatus() == BedStatus.VACANT).count();
        long maintenanceBeds = beds.stream()
                .filter(b -> b.getStatus() == BedStatus.MAINTENANCE || b.getStatus() == BedStatus.RESERVED)
                .count();
        double occupancyPct = totalBeds == 0 ? 0.0 : Math.round((occupiedBeds * 1000.0) / totalBeds) / 10.0;

        List<ResidentProfile> residents = residentProfileRepository.findAllByOwnerId(ownerId);
        long totalResidents = residents.size();
        long pendingKycCount = residents.stream().filter(r -> !r.isKycVerified()).count();

        List<Booking> bookings = bookingRepository.findAllByOwnerId(ownerId);
        long activeBookings = bookings.stream().filter(b -> b.getStatus() == BookingStatus.ACTIVE).count();
        long noticeGivenCount = bookings.stream().filter(b -> b.getStatus() == BookingStatus.NOTICE_GIVEN).count();

        List<Complaint> complaints = complaintRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        long openComplaints = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.OPEN).count();
        long inProgressComplaints = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS).count();

        LocalDate today = LocalDate.now(INDIA_ZONE);
        Instant monthStart = today.withDayOfMonth(1).atStartOfDay(INDIA_ZONE).toInstant();
        BigDecimal collectedThisMonth = paymentRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .filter(p -> {
                    Instant ts = p.getPaidAt() != null ? p.getPaidAt() : p.getCreatedAt();
                    return ts != null && !ts.isBefore(monthStart);
                })
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<RentInvoice> invoices = invoiceRepository.findAllByOwnerIdOrderByDueDateDesc(ownerId);
        BigDecimal pendingRentTotal = BigDecimal.ZERO;
        BigDecimal overdueRentTotal = BigDecimal.ZERO;
        long overdueInvoicesCount = 0;

        for (RentInvoice invoice : invoices) {
            if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.PAID) {
                continue;
            }
            BigDecimal balance = invoice.getTotalAmount().subtract(invoice.getPaidAmount());
            if (balance.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            pendingRentTotal = pendingRentTotal.add(balance);
            Property prop = propertyMap.get(invoice.getPropertyId());
            int graceDays = prop != null ? prop.getGracePeriodDays() : 0;
            boolean isOverdue = invoice.getStatus() == InvoiceStatus.OVERDUE
                    || invoice.getDueDate().plusDays(graceDays).isBefore(today);
            if (isOverdue) {
                overdueInvoicesCount++;
                overdueRentTotal = overdueRentTotal.add(balance);
            }
        }

        long pendingInvitationsCount = invitationRepository
                .countByOwnerIdAndStatus(ownerId, InvitationStatus.PENDING);

        BigDecimal expectedMonthlyRent = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.ACTIVE || b.getStatus() == BookingStatus.NOTICE_GIVEN)
                .map(Booking::getAgreedMonthlyRent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        java.util.Set<UUID> pendingResidents = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.ISSUED
                        || i.getStatus() == InvoiceStatus.PARTIALLY_PAID
                        || i.getStatus() == InvoiceStatus.OVERDUE)
                .filter(i -> i.getTotalAmount().subtract(i.getPaidAmount()).compareTo(BigDecimal.ZERO) > 0)
                .map(RentInvoice::getResidentId)
                .collect(Collectors.toSet());

        java.util.Set<UUID> paidResidents = invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .filter(i -> i.getBillingMonth() != null
                        && i.getBillingMonth().getYear() == today.getYear()
                        && i.getBillingMonth().getMonthValue() == today.getMonthValue())
                .map(RentInvoice::getResidentId)
                .filter(rid -> !pendingResidents.contains(rid))
                .collect(Collectors.toSet());

        long pendingVerificationCount = paymentSubmissionRepository
                .countByOwnerIdAndStatus(ownerId, PaymentSubmissionStatus.PENDING_VERIFICATION);

        return OwnerDashboardResponse.builder()
                .totalProperties(properties.size())
                .totalRooms(totalRooms)
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .vacantBeds(vacantBeds)
                .maintenanceBeds(maintenanceBeds)
                .occupancyPercentage(occupancyPct)
                .totalResidents(totalResidents)
                .activeBookings(activeBookings)
                .noticeGivenCount(noticeGivenCount)
                .pendingKycCount(pendingKycCount)
                .openComplaintsCount(openComplaints)
                .inProgressComplaintsCount(inProgressComplaints)
                .expectedMonthlyRent(expectedMonthlyRent)
                .collectedThisMonth(collectedThisMonth)
                .pendingRentTotal(pendingRentTotal)
                .overdueRentTotal(overdueRentTotal)
                .overdueInvoicesCount(overdueInvoicesCount)
                .pendingInvitationsCount(pendingInvitationsCount)
                .paidResidentsCount(paidResidents.size())
                .pendingResidentsCount(pendingResidents.size())
                .pendingVerificationCount(pendingVerificationCount)
                .build();
    }
}
