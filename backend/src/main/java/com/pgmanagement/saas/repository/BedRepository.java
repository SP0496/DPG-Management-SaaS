package com.pgmanagement.saas.repository;

import com.pgmanagement.saas.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BedRepository extends JpaRepository<Bed, UUID> {
    List<Bed> findByRoomId(UUID roomId);
    List<Bed> findByRoomIdAndStatus(UUID roomId, String status);
    Optional<Bed> findByIdAndStatus(UUID id, String status);
}
