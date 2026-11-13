package com.pgmanagement.saas.modules.room.repository;

import com.pgmanagement.saas.modules.room.entity.Bed;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BedRepository extends JpaRepository<Bed, UUID> {

    List<Bed> findAllByRoomIdAndOwnerId(UUID roomId, UUID ownerId);

    List<Bed> findAllByRoomIdInAndOwnerId(Collection<UUID> roomIds, UUID ownerId);

    List<Bed> findAllByOwnerId(UUID ownerId);

    List<Bed> findAllByPropertyIdAndOwnerId(UUID propertyId, UUID ownerId);

    Optional<Bed> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bed b WHERE b.id = :id AND b.ownerId = :ownerId")
    Optional<Bed> findByIdAndOwnerIdForUpdate(@Param("id") UUID id, @Param("ownerId") UUID ownerId);

    boolean existsByRoomIdAndBedCodeIgnoreCase(UUID roomId, String bedCode);
}
