package com.pgmanagement.saas.modules.owner.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "owner_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerProfile extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Column(name = "gst_number", length = 30)
    private String gstNumber;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "support_phone", length = 20)
    private String supportPhone;

    @Column(name = "support_email", length = 255)
    private String supportEmail;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "upi_id", length = 120)
    private String upiId;

    @Column(name = "upi_payee_name", length = 150)
    private String upiPayeeName;

    @Column(name = "bank_account_holder", length = 150)
    private String bankAccountHolder;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", length = 20)
    private String bankIfscCode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_status", nullable = false, length = 40)
    private OnboardingStatus onboardingStatus = OnboardingStatus.NOT_STARTED;
}
