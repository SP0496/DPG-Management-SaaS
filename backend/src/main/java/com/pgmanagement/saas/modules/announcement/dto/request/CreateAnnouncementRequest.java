package com.pgmanagement.saas.modules.announcement.dto.request;

import com.pgmanagement.saas.modules.announcement.entity.AnnouncementPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateAnnouncementRequest {

    private UUID propertyId;

    @NotBlank(message = "Announcement title is required")
    @Size(min = 3, max = 160, message = "Title must be between 3 and 160 characters")
    private String title;

    @NotBlank(message = "Announcement content is required")
    @Size(min = 5, max = 5000, message = "Content must be between 5 and 5000 characters")
    private String content;

    private AnnouncementPriority priority = AnnouncementPriority.NORMAL;

    private Instant expiresAt;
}
