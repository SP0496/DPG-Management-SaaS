package com.pgmanagement.saas.service;

import com.pgmanagement.saas.dto.request.TenantOnboardRequest;
import com.pgmanagement.saas.entity.*;
import com.pgmanagement.saas.exception.BadRequestException;
import com.pgmanagement.saas.exception.ResourceNotFoundException;
import com.pgmanagement.saas.repository.BedRepository;
import com.pgmanagement.saas.repository.OrganizationRepository;
import com.pgmanagement.saas.repository.TenantStayRepository;
import com.pgmanagement.saas.repository.UserRepository;
import com.pgmanagement.saas.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final UserRepository userRepository;
    private final BedRepository bedRepository;
    private final TenantStayRepository tenantStayRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TenantStay onboardTenant(TenantOnboardRequest request, UserPrincipal principal) {
        Organization organization = organizationRepository.findById(principal.getOrganizationId())
                .orElseThrow(() -> new BadRequestException("Organization not found"));

        Bed bed = bedRepository.findByIdAndStatus(request.getBedId(), "VACANT")
                .orElseThrow(() -> new BadRequestException("Selected bed is not available or does not exist"));

        // Create or fetch tenant user
        User tenantUser = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseGet(() -> {
                    // Generate initial temporary password
                    String randomPassword = UUID.randomUUID().toString().substring(0, 12) + "Aa1!";
                    return User.builder()
                            .organization(organization)
                            .email(request.getEmail().toLowerCase().trim())
                            .phone(request.getPhone().trim())
                            .passwordHash(passwordEncoder.encode(randomPassword))
                            .firstName(request.getFirstName().trim())
                            .lastName(request.getLastName().trim())
                            .role(Role.ROLE_TENANT)
                            .active(true)
                            .verified(false)
                            .build();
                });

        tenantUser = userRepository.save(tenantUser);

        // Update bed status to OCCUPIED
        bed.setStatus("OCCUPIED");
        bedRepository.save(bed);

        // Create stay record
        TenantStay stay = TenantStay.builder()
                .organization(organization)
                .user(tenantUser)
                .bed(bed)
                .checkInDate(request.getCheckInDate())
                .agreedMonthlyRent(request.getMonthlyRent())
                .securityDepositAmount(request.getSecurityDeposit())
                .depositStatus("PENDING")
                .stayStatus("ACTIVE")
                .build();

        return tenantStayRepository.save(stay);
    }

    @Transactional(readOnly = true)
    public List<TenantStay> getActiveStaysForOrganization(UserPrincipal principal) {
        return tenantStayRepository.findByOrganizationIdAndStayStatus(principal.getOrganizationId(), "ACTIVE");
    }
}
