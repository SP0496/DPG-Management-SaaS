package com.pgmanagement.saas.modules.users.service;

import com.pgmanagement.saas.modules.users.dto.request.UpdateUserRequest;
import com.pgmanagement.saas.modules.users.dto.response.UserResponse;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getProfile(UUID userId) {
        return UserResponse.from(getEntityById(userId));
    }

    @Transactional(readOnly = true)
    public User getEntityById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateUserRequest request) {
        User user = getEntityById(userId);
        user.setFullName(request.getFullName().trim());
        return UserResponse.from(userRepository.save(user));
    }
}
