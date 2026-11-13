-- ==============================================================================
-- V1: Initial Multi-Tenant Schema for PG-Management-SaaS
-- Covers all 12 domain modules with strict owner_id and resident_id scoping.
-- ==============================================================================

CREATE TABLE users (
    id                      UUID PRIMARY KEY,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    phone                   VARCHAR(20)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    full_name               VARCHAR(120) NOT NULL,
    role                    VARCHAR(30)  NOT NULL,
    firebase_uid            VARCHAR(128) UNIQUE,
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    is_account_non_locked   BOOLEAN      NOT NULL DEFAULT TRUE,
    failed_login_attempts   INTEGER      NOT NULL DEFAULT 0,
    last_login_at           TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE  NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_users_role ON users(role);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE owner_profiles (
    id                UUID PRIMARY KEY,
    user_id           UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name     VARCHAR(150) NOT NULL,
    gst_number        VARCHAR(30),
    pan_number        VARCHAR(20),
    support_phone     VARCHAR(20),
    support_email     VARCHAR(255),
    address           VARCHAR(500),
    city              VARCHAR(100),
    state             VARCHAR(100),
    postal_code       VARCHAR(20),
    onboarding_status VARCHAR(40)  NOT NULL DEFAULT 'NOT_STARTED',
    created_at        TIMESTAMP WITH TIME ZONE  NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE TABLE resident_profiles (
    id                      UUID PRIMARY KEY,
    user_id                 UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    owner_id                UUID         REFERENCES users(id) ON DELETE SET NULL,
    emergency_contact_name  VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    permanent_address       VARCHAR(500),
    id_proof_type           VARCHAR(40),
    id_proof_last4          VARCHAR(10),
    occupation              VARCHAR(120),
    kyc_verified            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE  NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_resident_profiles_owner ON resident_profiles(owner_id);

CREATE TABLE properties (
    id                  UUID PRIMARY KEY,
    owner_id            UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(150)   NOT NULL,
    property_type       VARCHAR(40)    NOT NULL,
    address_line1       VARCHAR(255)   NOT NULL,
    address_line2       VARCHAR(255),
    city                VARCHAR(100)   NOT NULL,
    state               VARCHAR(100)   NOT NULL,
    postal_code         VARCHAR(20)    NOT NULL,
    emergency_contact   VARCHAR(20)    NOT NULL,
    default_billing_day INTEGER        NOT NULL DEFAULT 1,
    grace_period_days   INTEGER        NOT NULL DEFAULT 5,
    late_fee_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amenities           TEXT,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE    NOT NULL
);

CREATE INDEX idx_properties_owner ON properties(owner_id);

CREATE TABLE rooms (
    id                    UUID PRIMARY KEY,
    owner_id              UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id           UUID           NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_number           VARCHAR(50)    NOT NULL,
    floor_number          INTEGER        NOT NULL DEFAULT 0,
    sharing_type          VARCHAR(30)    NOT NULL,
    base_monthly_rent     NUMERIC(12, 2) NOT NULL,
    has_attached_bathroom BOOLEAN        NOT NULL DEFAULT FALSE,
    has_balcony           BOOLEAN        NOT NULL DEFAULT FALSE,
    is_active             BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at            TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT uk_rooms_property_number UNIQUE (property_id, room_number)
);

CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_property ON rooms(property_id);

CREATE TABLE beds (
    id          UUID PRIMARY KEY,
    owner_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_code    VARCHAR(40) NOT NULL,
    status      VARCHAR(30) NOT NULL DEFAULT 'VACANT',
    version     BIGINT      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_beds_room_code UNIQUE (room_id, bed_code)
);

CREATE INDEX idx_beds_owner ON beds(owner_id);
CREATE INDEX idx_beds_room ON beds(room_id);

CREATE TABLE bookings (
    id                      UUID PRIMARY KEY,
    owner_id                UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id             UUID           NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id                 UUID           NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_id                  UUID           NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    resident_id             UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_date           DATE           NOT NULL,
    expected_check_out_date DATE,
    actual_check_out_date   DATE,
    agreed_monthly_rent     NUMERIC(12, 2) NOT NULL,
    security_deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deposit_status          VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    status                  VARCHAR(30)    NOT NULL DEFAULT 'ACTIVE',
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE    NOT NULL
);

CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_resident ON bookings(resident_id);
CREATE INDEX idx_bookings_bed ON bookings(bed_id);

CREATE TABLE rent_invoices (
    id              UUID PRIMARY KEY,
    owner_id        UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id     UUID           NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    resident_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id      UUID           NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(60)    NOT NULL UNIQUE,
    billing_month   DATE           NOT NULL,
    base_rent       NUMERIC(12, 2) NOT NULL,
    utility_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    penalty_fee     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount    NUMERIC(12, 2) NOT NULL,
    paid_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(10)    NOT NULL DEFAULT 'INR',
    status          VARCHAR(30)    NOT NULL DEFAULT 'ISSUED',
    due_date        DATE           NOT NULL,
    paid_at         TIMESTAMP WITH TIME ZONE,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL
);

CREATE INDEX idx_rent_invoices_owner ON rent_invoices(owner_id);
CREATE INDEX idx_rent_invoices_resident ON rent_invoices(resident_id);

CREATE TABLE payments (
    id               UUID PRIMARY KEY,
    owner_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id       UUID           NOT NULL REFERENCES rent_invoices(id) ON DELETE CASCADE,
    idempotency_key  VARCHAR(120)   UNIQUE,
    payment_method   VARCHAR(30)    NOT NULL,
    amount           NUMERIC(12, 2) NOT NULL,
    currency         VARCHAR(10)    NOT NULL DEFAULT 'INR',
    reference_number VARCHAR(120),
    status           VARCHAR(30)    NOT NULL DEFAULT 'COMPLETED',
    notes            TEXT,
    paid_at          TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE    NOT NULL
);

CREATE INDEX idx_payments_owner ON payments(owner_id);
CREATE INDEX idx_payments_resident ON payments(resident_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

CREATE TABLE complaints (
    id               UUID PRIMARY KEY,
    owner_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id      UUID         NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    resident_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id       UUID         REFERENCES bookings(id) ON DELETE SET NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT         NOT NULL,
    category         VARCHAR(40)  NOT NULL,
    priority         VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    status           VARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_at      TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE  NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_complaints_owner ON complaints(owner_id);
CREATE INDEX idx_complaints_resident ON complaints(resident_id);

CREATE TABLE announcements (
    id          UUID PRIMARY KEY,
    owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID         REFERENCES properties(id) ON DELETE CASCADE,
    title       VARCHAR(160) NOT NULL,
    content     TEXT         NOT NULL,
    priority    VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    expires_at  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE  NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_announcements_owner ON announcements(owner_id);
CREATE INDEX idx_announcements_property ON announcements(property_id);

CREATE TABLE notifications (
    id           UUID PRIMARY KEY,
    recipient_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(160) NOT NULL,
    body         TEXT         NOT NULL,
    type         VARCHAR(40)  NOT NULL,
    reference_id UUID,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at      TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

CREATE TABLE device_tokens (
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        VARCHAR(512) NOT NULL UNIQUE,
    platform     VARCHAR(20)  NOT NULL DEFAULT 'ANDROID',
    app_version  VARCHAR(30),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE  NOT NULL
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
