package com.pgmanagement.saas.modules.auth.service;

import com.pgmanagement.saas.modules.auth.dto.request.FirebaseLoginRequest;
import com.pgmanagement.saas.modules.auth.dto.request.RefreshTokenRequest;
import com.pgmanagement.saas.modules.auth.dto.response.AuthResponse;
import com.pgmanagement.saas.modules.auth.entity.RefreshToken;
import com.pgmanagement.saas.modules.auth.firebase.FirebaseProperties;
import com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenDetails;
import com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenVerifier;
import com.pgmanagement.saas.modules.auth.repository.RefreshTokenRepository;
import com.pgmanagement.saas.modules.owner.service.OwnerService;
import com.pgmanagement.saas.modules.resident.service.ResidentInvitationService;
import com.pgmanagement.saas.modules.resident.service.ResidentService;
import com.pgmanagement.saas.modules.users.dto.response.UserResponse;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.modules.users.entity.User;
import com.pgmanagement.saas.modules.users.repository.UserRepository;
import com.pgmanagement.saas.shared.exception.UnauthorizedException;
import com.pgmanagement.saas.shared.security.JwtTokenProvider;
import com.pgmanagement.saas.shared.security.UserPrincipal;
import com.pgmanagement.saas.shared.util.PhoneNumberUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OwnerService ownerService;
    private final ResidentService residentService;
    private final ResidentInvitationService residentInvitationService;
    private final JwtTokenProvider jwtTokenProvider;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final FirebaseProperties firebaseProperties;

    @Transactional
    public AuthResponse verifyFirebaseLogin(FirebaseLoginRequest request) {
        FirebaseTokenDetails verifiedToken = firebaseTokenVerifier.verifyIdToken(request.getFirebaseIdToken());
        if (verifiedToken.phoneNumber() == null || verifiedToken.phoneNumber().isBlank()) {
            throw new UnauthorizedException("Firebase token does not contain a verified Indian mobile number");
        }

        String normalizedPhone;
        try {
            normalizedPhone = PhoneNumberUtils.normalizeIndianE164(verifiedToken.phoneNumber());
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Only +91 Indian mobile numbers are supported for login");
        }

        Optional<User> existingUserOpt = userRepository.findByFirebaseUid(verifiedToken.uid())
                .or(() -> userRepository.findByPhone(normalizedPhone));

        boolean isNewUser = existingUserOpt.isEmpty();
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getFirebaseUid() != null && !user.getFirebaseUid().equals(verifiedToken.uid())) {
                throw new UnauthorizedException("Mobile number is bound to a different Firebase identity");
            }
            if (!user.isActive() || !user.isAccountNonLocked()) {
                throw new UnauthorizedException("User account is disabled or locked");
            }
            if (user.getFirebaseUid() == null) {
                user.setFirebaseUid(verifiedToken.uid());
            }
            if ((user.getFullName() == null || user.getFullName().isBlank())
                    && request.getFullName() != null && !request.getFullName().isBlank()) {
                user.setFullName(request.getFullName().trim());
            }
            user.setFailedLoginAttempts(0);
            user.setLastLoginAt(Instant.now());
            user = userRepository.save(user);
        } else {
            Role assignedRole = resolveRoleFromTrustedSources(verifiedToken, normalizedPhone);
            String fullName = resolveInitialFullName(request.getFullName(), verifiedToken.name(), assignedRole);
            String email = resolveOptionalEmail(verifiedToken.email());

            user = User.builder()
                    .firebaseUid(verifiedToken.uid())
                    .phone(normalizedPhone)
                    .email(email)
                    .fullName(fullName)
                    .role(assignedRole)
                    .active(true)
                    .accountNonLocked(true)
                    .failedLoginAttempts(0)
                    .lastLoginAt(Instant.now())
                    .build();
            user = userRepository.save(user);
        }

        if (user.getRole() == Role.OWNER) {
            ownerService.initializeProfileForOwner(user, null);
        } else {
            residentService.initializeProfileForResident(user);
            residentInvitationService.verifyOrAutoAcceptOnLogin(user, request.getInviteCode());
        }

        return issueTokens(user, isNewUser);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawRefreshToken = request.getRefreshToken().trim();
        if (!jwtTokenProvider.validateRefreshToken(rawRefreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(sha256Hex(rawRefreshToken))
                .orElseThrow(() -> new UnauthorizedException("Refresh token session not recognized"));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token session has expired or been revoked");
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(rawRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User account not found"));

        if (!user.isActive() || !user.isAccountNonLocked()) {
            throw new UnauthorizedException("User account is disabled or locked");
        }

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        return issueTokens(user, false);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken().trim();
        refreshTokenRepository.findByTokenHash(sha256Hex(rawToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
        return UserResponse.from(user);
    }

    private Role resolveRoleFromTrustedSources(FirebaseTokenDetails verifiedToken, String normalizedPhone) {
        if (verifiedToken.verifiedClaimRole() != null) {
            return verifiedToken.verifiedClaimRole();
        }
        if (firebaseProperties.normalizedOwnerPhones().contains(normalizedPhone)) {
            return Role.OWNER;
        }
        return Role.RESIDENT;
    }

    private String resolveInitialFullName(String requestName, String tokenName, Role role) {
        if (requestName != null && !requestName.isBlank()) {
            return requestName.trim();
        }
        if (tokenName != null && !tokenName.isBlank()) {
            return tokenName.trim();
        }
        return role == Role.OWNER ? "PG Owner" : "PG Resident";
    }

    private String resolveOptionalEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return null;
        }
        String normalized = rawEmail.trim().toLowerCase();
        return userRepository.existsByEmailIgnoreCase(normalized) ? null : normalized;
    }

    private AuthResponse issueTokens(User user, boolean newUser) {
        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        RefreshToken entity = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(sha256Hex(refreshToken))
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs()))
                .revoked(false)
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(entity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtTokenProvider.getAccessExpirationMs())
                .newUser(newUser)
                .user(UserResponse.from(user))
                .build();
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }
}
