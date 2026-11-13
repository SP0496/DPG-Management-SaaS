package com.pgmanagement.saas.modules.complaint.service;

import com.pgmanagement.saas.modules.booking.entity.Booking;
import com.pgmanagement.saas.modules.booking.service.BookingService;
import com.pgmanagement.saas.modules.complaint.dto.request.CreateComplaintRequest;
import com.pgmanagement.saas.modules.complaint.dto.request.UpdateComplaintStatusRequest;
import com.pgmanagement.saas.modules.complaint.dto.response.ComplaintResponse;
import com.pgmanagement.saas.modules.complaint.entity.Complaint;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintPriority;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import com.pgmanagement.saas.modules.complaint.repository.ComplaintRepository;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.dto.PagedResponse;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final BookingService bookingService;
    private final NotificationService notificationService;

    @Transactional
    public ComplaintResponse submitComplaint(UUID residentId, CreateComplaintRequest request) {
        Booking activeBooking = bookingService.findActiveResidentBooking(residentId);

        Complaint complaint = Complaint.builder()
                .ownerId(activeBooking.getOwnerId())
                .propertyId(activeBooking.getPropertyId())
                .residentId(residentId)
                .bookingId(activeBooking.getId())
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory())
                .priority(request.getPriority() != null ? request.getPriority() : ComplaintPriority.MEDIUM)
                .status(ComplaintStatus.OPEN)
                .build();

        Complaint saved = complaintRepository.save(complaint);

        notificationService.createNotification(
                saved.getOwnerId(),
                saved.getOwnerId(),
                "New Resident Complaint",
                saved.getTitle(),
                NotificationType.COMPLAINT,
                saved.getId()
        );

        return ComplaintResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> listComplaints(UUID userId, Role role) {
        List<Complaint> complaints = role == Role.OWNER
                ? complaintRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                : complaintRepository.findAllByResidentIdOrderByCreatedAtDesc(userId);
        return complaints.stream().map(ComplaintResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ComplaintResponse> searchComplaints(
            UUID userId,
            Role role,
            ComplaintStatus status,
            ComplaintPriority priority,
            UUID propertyId,
            String search,
            int page,
            int size) {
        List<Complaint> complaints = role == Role.OWNER
                ? complaintRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                : complaintRepository.findAllByResidentIdOrderByCreatedAtDesc(userId);
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<ComplaintResponse> filtered = complaints.stream()
                .filter(c -> status == null || c.getStatus() == status)
                .filter(c -> priority == null || c.getPriority() == priority)
                .filter(c -> propertyId == null || c.getPropertyId().equals(propertyId))
                .filter(c -> normalizedSearch.isEmpty()
                        || c.getTitle().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || c.getDescription().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || c.getCategory().name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .map(ComplaintResponse::from)
                .toList();
        return PagedResponse.ofList(filtered, page, size);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaint(UUID complaintId, UUID userId, Role role) {
        Complaint complaint = role == Role.OWNER
                ? complaintRepository.findByIdAndOwnerId(complaintId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Complaint not found for this owner"))
                : complaintRepository.findByIdAndResidentId(complaintId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Complaint not found for this resident"));
        return ComplaintResponse.from(complaint);
    }

    @Transactional
    public ComplaintResponse updateStatus(UUID complaintId, UUID ownerId, UpdateComplaintStatusRequest request) {
        Complaint complaint = complaintRepository.findByIdAndOwnerId(complaintId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found for this owner"));

        complaint.setStatus(request.getStatus());
        if (request.getResolutionNotes() != null && !request.getResolutionNotes().isBlank()) {
            complaint.setResolutionNotes(request.getResolutionNotes().trim());
        }
        if (request.getStatus() == ComplaintStatus.RESOLVED || request.getStatus() == ComplaintStatus.CLOSED) {
            complaint.setResolvedAt(Instant.now());
        }

        Complaint saved = complaintRepository.save(complaint);

        notificationService.createNotification(
                saved.getResidentId(),
                ownerId,
                "Complaint Status Updated",
                "Your ticket '" + saved.getTitle() + "' is now " + saved.getStatus().name(),
                NotificationType.COMPLAINT,
                saved.getId()
        );

        return ComplaintResponse.from(saved);
    }
}
