package com.pgmanagement.saas.modules.notification.repository;

import com.pgmanagement.saas.modules.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    List<Notification> findAllByRecipientIdAndReadFalse(UUID recipientId);
}
