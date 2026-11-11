package com.pgmanagement.saas.repository;

import com.pgmanagement.saas.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByPropertyIdAndActiveTrue(UUID propertyId);
    Optional<Room> findByIdAndPropertyId(UUID id, UUID propertyId);
}
