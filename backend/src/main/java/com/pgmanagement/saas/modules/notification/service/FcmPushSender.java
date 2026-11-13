package com.pgmanagement.saas.modules.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.pgmanagement.saas.modules.notification.entity.DeviceToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Dispatches push notifications via Firebase Cloud Messaging when Firebase Admin is active.
 */
@Component
@Slf4j
public class FcmPushSender {

    public boolean sendToTokens(
            List<DeviceToken> tokens,
            String title,
            String body,
            Map<String, String> data) {
        if (tokens == null || tokens.isEmpty()) {
            return false;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("FCM skipped: FirebaseApp not initialized in current environment");
            return false;
        }

        boolean anySent = false;
        FirebaseMessaging messaging = FirebaseMessaging.getInstance();
        for (DeviceToken deviceToken : tokens) {
            if (!deviceToken.isActive() || deviceToken.getToken() == null || deviceToken.getToken().isBlank()) {
                continue;
            }
            try {
                Message.Builder builder = Message.builder()
                        .setToken(deviceToken.getToken())
                        .setNotification(com.google.firebase.messaging.Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setAndroidConfig(AndroidConfig.builder()
                                .setPriority(AndroidConfig.Priority.HIGH)
                                .build());
                if (data != null && !data.isEmpty()) {
                    builder.putAllData(data);
                }
                messaging.send(builder.build());
                anySent = true;
            } catch (Exception ex) {
                log.warn("Failed to deliver FCM push to token {}: {}", deviceToken.getId(), ex.getMessage());
            }
        }
        return anySent;
    }
}
