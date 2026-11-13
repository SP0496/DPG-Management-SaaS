package com.pgmanagement.saas.modules.notification.service;

import com.pgmanagement.saas.modules.notification.dto.request.RegisterDeviceTokenRequest;
import com.pgmanagement.saas.modules.notification.dto.response.NotificationResponse;
import com.pgmanagement.saas.modules.notification.entity.DevicePlatform;
import com.pgmanagement.saas.modules.notification.entity.DeviceToken;
import com.pgmanagement.saas.modules.notification.entity.Notification;
import com.pgmanagement.saas.modules.notification.entity.NotificationType;
import com.pgmanagement.saas.modules.notification.repository.DeviceTokenRepository;
import com.pgmanagement.saas.modules.notification.repository.NotificationRepository;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final FcmPushSender fcmPushSender;

    @Transactional
    public void createNotification(
            UUID recipientId,
            UUID ownerId,
            String title,
            String body,
            NotificationType type,
            UUID referenceId) {
        createNotification(recipientId, ownerId, title, body, type, referenceId, null, null);
    }

    @Transactional
    public void createNotification(
            UUID recipientId,
            UUID ownerId,
            String title,
            String body,
            NotificationType type,
            UUID referenceId,
            String targetType,
            UUID transactionSubmissionId) {

        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .ownerId(ownerId)
                .title(title)
                .body(body)
                .type(type)
                .referenceId(referenceId)
                .targetType(targetType)
                .transactionSubmissionId(transactionSubmissionId)
                .read(false)
                .createdAt(Instant.now())
                .build();

        List<DeviceToken> tokens = deviceTokenRepository.findAllByUserIdAndActiveTrue(recipientId);
        if (!tokens.isEmpty()) {
            Map<String, String> payload = new HashMap<>();
            payload.put("type", type.name());
            if (referenceId != null) {
                payload.put("referenceId", referenceId.toString());
            }
            if (targetType != null) {
                payload.put("targetType", targetType);
            }
            if (transactionSubmissionId != null) {
                payload.put("submissionId", transactionSubmissionId.toString());
            }
            boolean pushed = fcmPushSender.sendToTokens(tokens, title, body, payload);
            notification.setPushSent(pushed);
        }

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listMyNotifications(UUID userId) {
        return notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findAllByRecipientIdAndReadFalse(userId);
        if (unread.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        for (Notification n : unread) {
            n.setRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void registerDeviceToken(UUID userId, RegisterDeviceTokenRequest request) {
        Instant now = Instant.now();
        String tokenValue = request.getToken().trim();
        DeviceToken token = deviceTokenRepository.findByToken(tokenValue)
                .orElseGet(() -> DeviceToken.builder()
                        .token(tokenValue)
                        .createdAt(now)
                        .build());

        token.setUserId(userId);
        token.setPlatform(request.getPlatform() != null ? request.getPlatform() : DevicePlatform.ANDROID);
        token.setAppVersion(request.getAppVersion());
        token.setActive(true);
        token.setLastSeenAt(now);
        deviceTokenRepository.save(token);
    }

    @Transactional
    public void deactivateDeviceToken(UUID userId, String tokenValue) {
        deviceTokenRepository.findByTokenAndUserId(tokenValue.trim(), userId)
                .ifPresent(token -> {
                    token.setActive(false);
                    deviceTokenRepository.save(token);
                });
    }
}
