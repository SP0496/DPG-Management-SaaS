package com.pgmanagement.saas.modules.complaint.dto.response;

import com.pgmanagement.saas.modules.complaint.entity.Complaint;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintCategory;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintPriority;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ComplaintResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private UUID residentId;
    private UUID bookingId;
    private String title;
    private String description;
    private ComplaintCategory category;
    private ComplaintPriority priority;
    private ComplaintStatus status;
    private String resolutionNotes;
    private Instant resolvedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static ComplaintResponse from(Complaint complaint) {
        return ComplaintResponse.builder()
                .id(complaint.getId())
                .ownerId(complaint.getOwnerId())
                .propertyId(complaint.getPropertyId())
                .residentId(complaint.getResidentId())
                .bookingId(complaint.getBookingId())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .category(complaint.getCategory())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .resolutionNotes(complaint.getResolutionNotes())
                .resolvedAt(complaint.getResolvedAt())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }
}
