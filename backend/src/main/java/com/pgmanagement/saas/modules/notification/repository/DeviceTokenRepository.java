package com.pgmanagement.saas.modules.notification.repository;

import com.pgmanagement.saas.modules.notification.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {

    Optional<DeviceToken> findByToken(String token);

    Optional<DeviceToken> findByTokenAndUserId(String token, UUID userId);

    List<DeviceToken> findAllByUserIdAndActiveTrue(UUID userId);
}
