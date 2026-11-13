-- Verified direct rent payment workflow, integer paise precision, fixed rent agreements, and notifications metadata

-- 1. Owner UPI & direct bank account configuration (no payment gateway)
ALTER TABLE owner_profiles ADD COLUMN upi_id VARCHAR(120);
ALTER TABLE owner_profiles ADD COLUMN upi_payee_name VARCHAR(150);
ALTER TABLE owner_profiles ADD COLUMN bank_account_holder VARCHAR(150);
ALTER TABLE owner_profiles ADD COLUMN bank_name VARCHAR(120);
ALTER TABLE owner_profiles ADD COLUMN bank_account_number VARCHAR(50);
ALTER TABLE owner_profiles ADD COLUMN bank_ifsc_code VARCHAR(20);

-- 2. Fixed agreed rent assignments & formal revision agreements
CREATE TABLE resident_assignments (
    id                        UUID PRIMARY KEY,
    booking_id                UUID                     NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    owner_id                  UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id               UUID                     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id                   UUID                     NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_id                    UUID                     NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    resident_id               UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreed_monthly_rent_paise BIGINT                   NOT NULL,
    security_deposit_paise    BIGINT                   NOT NULL DEFAULT 0,
    agreement_effective_date  DATE                     NOT NULL,
    status                    VARCHAR(30)              NOT NULL DEFAULT 'ACTIVE',
    notes                     TEXT,
    created_at                TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_res_assignments_owner ON resident_assignments(owner_id);
CREATE INDEX idx_res_assignments_resident ON resident_assignments(resident_id);

CREATE TABLE rent_revision_agreements (
    id                UUID PRIMARY KEY,
    assignment_id     UUID                     NOT NULL REFERENCES resident_assignments(id) ON DELETE CASCADE,
    booking_id        UUID                     NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    owner_id          UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id       UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_rent_paise BIGINT                 NOT NULL,
    proposed_rent_paise BIGINT                 NOT NULL,
    effective_date    DATE                     NOT NULL,
    reason            TEXT,
    status            VARCHAR(40)              NOT NULL DEFAULT 'PENDING_RESIDENT_ACCEPTANCE',
    proposed_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at      TIMESTAMP WITH TIME ZONE,
    resident_remarks  TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_rent_revisions_booking ON rent_revision_agreements(booking_id);
CREATE INDEX idx_rent_revisions_resident ON rent_revision_agreements(resident_id);

-- Backfill existing bookings into resident_assignments
INSERT INTO resident_assignments (
    id, booking_id, owner_id, property_id, room_id, bed_id, resident_id,
    agreed_monthly_rent_paise, security_deposit_paise, agreement_effective_date,
    status, notes, created_at, updated_at
)
SELECT
    id, id, owner_id, property_id, room_id, bed_id, resident_id,
    CAST(ROUND(agreed_monthly_rent * 100) AS BIGINT),
    CAST(ROUND(security_deposit_amount * 100) AS BIGINT),
    check_in_date,
    status,
    notes,
    created_at,
    updated_at
FROM bookings;

-- 3. Integer paise columns & billing period on rent_invoices
ALTER TABLE rent_invoices ADD COLUMN base_rent_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rent_invoices ADD COLUMN additional_charges_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rent_invoices ADD COLUMN penalty_fee_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rent_invoices ADD COLUMN total_amount_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rent_invoices ADD COLUMN paid_amount_paise BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rent_invoices ADD COLUMN billing_period_start DATE;
ALTER TABLE rent_invoices ADD COLUMN billing_period_end DATE;
ALTER TABLE rent_invoices ADD COLUMN assignment_id UUID;

UPDATE rent_invoices
SET base_rent_paise = CAST(ROUND(base_rent * 100) AS BIGINT),
    additional_charges_paise = CAST(ROUND(utility_charges * 100) AS BIGINT),
    penalty_fee_paise = CAST(ROUND(penalty_fee * 100) AS BIGINT),
    total_amount_paise = CAST(ROUND(total_amount * 100) AS BIGINT),
    paid_amount_paise = CAST(ROUND(paid_amount * 100) AS BIGINT),
    billing_period_start = billing_month,
    assignment_id = booking_id;

-- 4. Line-item breakdown for rent invoices (Base Rent, Additional Charges, Penalty)
CREATE TABLE invoice_items (
    id           UUID PRIMARY KEY,
    invoice_id   UUID                     NOT NULL REFERENCES rent_invoices(id) ON DELETE CASCADE,
    owner_id     UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type    VARCHAR(30)              NOT NULL,
    description  VARCHAR(200)             NOT NULL,
    amount_paise BIGINT                   NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 5. Resident direct payment submissions awaiting bank/owner verification
CREATE TABLE payment_submissions (
    id                UUID PRIMARY KEY,
    owner_id          UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id       UUID                     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    floor_number      INTEGER                  NOT NULL DEFAULT 0,
    room_number       VARCHAR(50),
    resident_id       UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id        UUID                     NOT NULL REFERENCES rent_invoices(id) ON DELETE CASCADE,
    idempotency_key   VARCHAR(120)             NOT NULL UNIQUE,
    payment_method    VARCHAR(30)              NOT NULL,
    amount_paise      BIGINT                   NOT NULL,
    currency          VARCHAR(10)              NOT NULL DEFAULT 'INR',
    utr_reference     VARCHAR(120)             NOT NULL,
    normalized_utr    VARCHAR(120)             NOT NULL,
    payer_upi_id      VARCHAR(120),
    payer_name        VARCHAR(150),
    bank_name         VARCHAR(120),
    payment_date      DATE                     NOT NULL,
    notes             TEXT,
    status            VARCHAR(30)              NOT NULL DEFAULT 'PENDING_VERIFICATION',
    rejection_reason  TEXT,
    submitted_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_payment_submissions_owner_utr UNIQUE (owner_id, normalized_utr)
);

CREATE INDEX idx_pay_sub_owner_status ON payment_submissions(owner_id, status);
CREATE INDEX idx_pay_sub_resident ON payment_submissions(resident_id);
CREATE INDEX idx_pay_sub_invoice ON payment_submissions(invoice_id);

-- 6. Owner verification / confirmation decisions
CREATE TABLE payment_confirmations (
    id                      UUID PRIMARY KEY,
    submission_id           UUID                     NOT NULL UNIQUE REFERENCES payment_submissions(id) ON DELETE CASCADE,
    invoice_id              UUID                     NOT NULL REFERENCES rent_invoices(id) ON DELETE CASCADE,
    owner_id                UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id             UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id              UUID                     REFERENCES payments(id) ON DELETE SET NULL,
    decision                VARCHAR(30)              NOT NULL,
    verified_by_owner_id    UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_source     VARCHAR(60)              NOT NULL DEFAULT 'OWNER_MANUAL_RECONCILIATION',
    receipt_number          VARCHAR(60)              UNIQUE,
    confirmed_amount_paise  BIGINT                   NOT NULL DEFAULT 0,
    remarks                 TEXT,
    decided_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_pay_conf_owner ON payment_confirmations(owner_id);
CREATE INDEX idx_pay_conf_invoice ON payment_confirmations(invoice_id);

-- 7. Payment lifecycle audit trail
CREATE TABLE payment_audit_logs (
    id              UUID PRIMARY KEY,
    submission_id   UUID                     REFERENCES payment_submissions(id) ON DELETE CASCADE,
    invoice_id      UUID                     REFERENCES rent_invoices(id) ON DELETE CASCADE,
    owner_id        UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id     UUID                     REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id   UUID                     NOT NULL,
    actor_role      VARCHAR(30)              NOT NULL,
    action          VARCHAR(50)              NOT NULL,
    previous_status VARCHAR(30),
    new_status      VARCHAR(30)              NOT NULL,
    details         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_pay_audit_submission ON payment_audit_logs(submission_id);
CREATE INDEX idx_pay_audit_owner ON payment_audit_logs(owner_id);

-- 8. Notification deep-linking & FCM push tracking
ALTER TABLE notifications ADD COLUMN target_type VARCHAR(40);
ALTER TABLE notifications ADD COLUMN transaction_submission_id UUID;
ALTER TABLE notifications ADD COLUMN push_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN push_error TEXT;
