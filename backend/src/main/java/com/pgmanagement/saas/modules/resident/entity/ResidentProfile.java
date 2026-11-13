package com.pgmanagement.saas.modules.resident.entity;

import com.pgmanagement.saas.shared.entity.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "resident_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResidentProfile extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "emergency_contact_name", length = 120)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "permanent_address", length = 500)
    private String permanentAddress;

    @Column(name = "id_proof_type", length = 40)
    private String idProofType;

    @Column(name = "id_proof_last4", length = 10)
    private String idProofLast4;

    @Column(length = 120)
    private String occupation;

    @Builder.Default
    @Column(name = "kyc_verified", nullable = false)
    private boolean kycVerified = false;
}
