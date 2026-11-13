package com.pgmanagement.saas.modules.users.repository;

import com.pgmanagement.saas.modules.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByFirebaseUid(String firebaseUid);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    boolean existsByFirebaseUid(String firebaseUid);
}
