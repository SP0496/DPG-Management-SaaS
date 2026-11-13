package com.pgmanagement.saas.modules.announcement.repository;

import com.pgmanagement.saas.modules.announcement.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    List<Announcement> findAllByOwnerIdAndActiveTrueOrderByCreatedAtDesc(UUID ownerId);

    @Query("""
            SELECT a FROM Announcement a
            WHERE a.ownerId = :ownerId
              AND a.active = true
              AND (a.propertyId IS NULL OR a.propertyId = :propertyId)
            ORDER BY a.createdAt DESC
            """)
    List<Announcement> findActiveForResidentProperty(
            @Param("ownerId") UUID ownerId,
            @Param("propertyId") UUID propertyId);

    Optional<Announcement> findByIdAndOwnerId(UUID id, UUID ownerId);
}
