package com.pgmanagement.saas.modules.notification.dto.response;

import com.pgmanagement.saas.modules.notification.entity.Notification;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;
    private UUID recipientId;
    private UUID ownerId;
    private String title;
    private String body;
    private NotificationType type;
    private UUID referenceId;
    private String targetType;
    private UUID transactionSubmissionId;
    private boolean pushSent;
    private boolean read;
    private Instant readAt;
    private Instant createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .ownerId(notification.getOwnerId())
                .title(notification.getTitle())
                .body(notification.getBody())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .targetType(notification.getTargetType())
                .transactionSubmissionId(notification.getTransactionSubmissionId())
                .pushSent(notification.isPushSent())
                .read(notification.isRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
