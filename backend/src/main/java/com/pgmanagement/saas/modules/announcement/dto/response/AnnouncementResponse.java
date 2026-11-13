package com.pgmanagement.saas.modules.announcement.dto.response;

import com.pgmanagement.saas.modules.announcement.entity.Announcement;
import com.pgmanagement.saas.modules.announcement.entity.AnnouncementPriority;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AnnouncementResponse {

    private UUID id;
    private UUID ownerId;
    private UUID propertyId;
    private String title;
    private String content;
    private AnnouncementPriority priority;
    private boolean active;
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static AnnouncementResponse from(Announcement announcement) {
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .ownerId(announcement.getOwnerId())
                .propertyId(announcement.getPropertyId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .priority(announcement.getPriority())
                .active(announcement.isActive())
                .expiresAt(announcement.getExpiresAt())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}
