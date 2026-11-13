package com.pgmanagement.saas.modules.notification.controller;

import com.pgmanagement.saas.modules.notification.dto.request.RegisterDeviceTokenRequest;
import com.pgmanagement.saas.modules.notification.dto.response.NotificationResponse;
import com.pgmanagement.saas.modules.notification.service.NotificationService;
import com.pgmanagement.saas.shared.dto.ApiResponse;
import com.pgmanagement.saas.shared.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications and FCM device token registry foundation")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications belonging to the authenticated user")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> listMyNotifications() {
        List<NotificationResponse> notifications =
                notificationService.listMyNotifications(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count for authenticated user")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        long unread = notificationService.getUnreadCount(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(unread));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable UUID notificationId) {
        NotificationResponse updated = notificationService.markAsRead(notificationId, TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for authenticated user")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead() {
        int count = notificationService.markAllAsRead(TenantContext.currentUserId());
        return ResponseEntity.ok(ApiResponse.success(count, "All notifications marked as read"));
    }

    @PostMapping("/device-tokens")
    @Operation(summary = "Register or refresh an Android/FCM push device token")
    public ResponseEntity<ApiResponse<Void>> registerDeviceToken(
            @Valid @RequestBody RegisterDeviceTokenRequest request) {
        notificationService.registerDeviceToken(TenantContext.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Device token registered"));
    }

    @DeleteMapping("/device-tokens/{token}")
    @Operation(summary = "Deactivate a device push token")
    public ResponseEntity<ApiResponse<Void>> deactivateDeviceToken(@PathVariable String token) {
        notificationService.deactivateDeviceToken(TenantContext.currentUserId(), token);
        return ResponseEntity.ok(ApiResponse.ok("Device token deactivated"));
    }
}
