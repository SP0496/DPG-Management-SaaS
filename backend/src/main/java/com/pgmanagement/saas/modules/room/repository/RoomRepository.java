package com.pgmanagement.saas.modules.room.repository;

import com.pgmanagement.saas.modules.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    List<Room> findAllByOwnerIdAndActiveTrue(UUID ownerId);

    List<Room> findAllByPropertyIdAndOwnerIdAndActiveTrue(UUID propertyId, UUID ownerId);

    Optional<Room> findByIdAndOwnerId(UUID id, UUID ownerId);

    boolean existsByPropertyIdAndRoomNumberIgnoreCase(UUID propertyId, String roomNumber);
}
