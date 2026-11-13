package com.pgmanagement.saas.modules.owner.entity;

/**
 * Owner verification and merchant onboarding readiness status.
 */
public enum OnboardingStatus {
    NOT_STARTED,
    PENDING_KYC,
    ACTIVATED,
    SUSPENDED
}
