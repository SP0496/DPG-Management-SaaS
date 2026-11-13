-- ==============================================================================
-- V2: Firebase Phone OTP Authentication Hardening
-- Allows passwordless Firebase phone identities without mandatory email/password.
-- ==============================================================================

ALTER TABLE users
    ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;
