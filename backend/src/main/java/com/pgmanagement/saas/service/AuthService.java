package com.pgmanagement.saas.service;

import com.pgmanagement.saas.dto.request.LoginRequest;
import com.pgmanagement.saas.dto.request.RegisterRequest;
import com.pgmanagement.saas.dto.response.AuthResponse;
import com.pgmanagement.saas.dto.response.UserProfileResponse;
import com.pgmanagement.saas.entity.Organization;
import com.pgmanagement.saas.entity.Role;
import com.pgmanagement.saas.entity.User;
import com.pgmanagement.saas.exception.BadRequestException;
import com.pgmanagement.saas.exception.UnauthorizedException;
import com.pgmanagement.saas.repository.OrganizationRepository;
import com.pgmanagement.saas.repository.UserRepository;
import com.pgmanagement.saas.security.JwtTokenProvider;
import com.pgmanagement.saas.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.security.jwt.expiration-ms:900000}")
    private long jwtExpirationInMs;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("An account with this email address already exists");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("An account with this phone number already exists");
        }

        // 1. Create Organization (Tenant Root)
        Organization organization = Organization.builder()
                .name(request.getOrganizationName().trim())
                .contactEmail(request.getEmail().toLowerCase().trim())
                .contactPhone(request.getPhone().trim())
                .subscriptionTier("STARTER")
                .active(true)
                .build();
        organization = organizationRepository.save(organization);

        // 2. Hash Password using BCrypt (work factor 12)
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Create Property Admin User
        User user = User.builder()
                .organization(organization)
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone().trim())
                .passwordHash(hashedPassword)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(Role.ROLE_PROPERTY_ADMIN)
                .active(true)
                .verified(false)
                .failedLoginAttempts(0)
                .build();
        user = userRepository.save(user);

        // 4. Authenticate and Generate Tokens
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        // Check Account Lockout
        if (!user.isAccountNonLocked()) {
            throw new BadRequestException("Account is temporarily locked due to excessive failed attempts. Please try again later.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Reset failed login attempts on successful authentication
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLockoutUntil(null);
                userRepository.save(user);
            }

            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(user.getId());

            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException ex) {
            // Handle failed attempt & apply lockout threshold
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockoutUntil(Instant.now().plus(LOCKOUT_DURATION));
                log.warn("User account locked due to {} failed attempts: {}", attempts, email);
            }
            userRepository.save(user);

            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("User profile not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .email(user.getEmail())
                .phone(user.getPhone())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .verified(user.isVerified())
                .build();
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .tokenType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtExpirationInMs / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                        .build())
                .build();
    }
}
