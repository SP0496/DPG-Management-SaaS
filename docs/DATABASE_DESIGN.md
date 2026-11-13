# Database Design: PG Management SaaS

## 1. Multi-Tenant Data Isolation Strategy

The PostgreSQL 16 database implements **Strict Logical Multi-Tenancy with Owner & Resident Scoping**:

1. **Denormalized Tenant Keys (`owner_id` & `resident_id`)**:
   - Every operational table (`properties`, `rooms`, `beds`, `resident_stays`, `rent_invoices`, `payments`, `complaints`, `owner_merchant_accounts`) includes a non-null `owner_id` foreign key referencing `users(id)`.
   - Resident-accessible tables (`resident_stays`, `rent_invoices`, `payments`, `complaints`) additionally carry `resident_id` referencing `users(id)`.
   - This eliminates multi-table joins when validating authorization (`WHERE id = :entityId AND owner_id = :authenticatedOwnerId` or `WHERE id = :entityId AND resident_id = :authenticatedResidentId`).
2. **Defense-in-Depth PostgreSQL Row-Level Security (RLS)**:
   - In addition to JPA repository enforcement, PostgreSQL RLS policies can be bound to session variables (`SET LOCAL app.current_user_id`, `SET LOCAL app.current_role`) so that even raw queries cannot cross tenant boundaries.
3. **Versioned Migrations**:
   - Schema changes are managed via **Flyway** (`db/migration/V1__...sql`, `V2__...sql`) with `spring.jpa.hibernate.ddl-auto: validate` in production.

---

## 2. Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| OWNER_MERCHANT_ACCOUNTS : "owns merchant account"
    USERS ||--o{ PROPERTIES : "owns (OWNER)"
    USERS ||--o{ RESIDENT_STAYS : "occupies (RESIDENT)"
    USERS ||--o{ FCM_DEVICE_TOKENS : "registers"
    USERS ||--o{ AUDIT_LOGS : "performs"

    PROPERTIES ||--o{ ROOMS : "contains"
    ROOMS ||--o{ BEDS : "contains"
    BEDS ||--o{ RESIDENT_STAYS : "allocated to"

    RESIDENT_STAYS ||--o{ RENT_INVOICES : "billed"
    RESIDENT_STAYS ||--o{ COMPLAINTS : "files"
    RENT_INVOICES ||--o{ PAYMENTS : "paid via"
    OWNER_MERCHANT_ACCOUNTS ||--o{ PAYMENTS : "settles directly"

    USERS {
        uuid id PK
        varchar firebase_uid UK
        varchar phone UK
        varchar email
        varchar full_name
        varchar role "OWNER | RESIDENT"
        boolean is_active
        boolean is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    OWNER_MERCHANT_ACCOUNTS {
        uuid id PK
        uuid owner_id UK,FK
        varchar integration_mode "PARTNER_OAUTH | ROUTE_LINKED_ACCOUNT"
        varchar razorpay_merchant_id UK
        varchar razorpay_linked_account_id
        varchar public_key_id
        text encrypted_oauth_access_token
        text encrypted_oauth_refresh_token
        text encrypted_key_secret
        text encrypted_webhook_secret
        timestamptz token_expires_at
        varchar onboarding_status "NOT_STARTED | PENDING_KYC | ACTIVATED | SUSPENDED"
        varchar bank_account_last4
        varchar bank_ifsc
        varchar bank_verification_status "UNVERIFIED | VERIFIED | FAILED"
        timestamptz activated_at
        timestamptz created_at
        timestamptz updated_at
    }

    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        varchar name
        varchar property_type
        varchar address_line1
        varchar city
        varchar state
        varchar postal_code
        varchar emergency_contact
        int default_billing_day
        int grace_period_days
        numeric late_fee_amount
        jsonb amenities
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    ROOMS {
        uuid id PK
        uuid owner_id FK
        uuid property_id FK
        varchar room_number
        int floor_number
        varchar sharing_type
        numeric base_monthly_rent
        boolean has_attached_bathroom
        boolean has_balcony
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    BEDS {
        uuid id PK
        uuid owner_id FK
        uuid room_id FK
        varchar bed_code
        varchar status "VACANT | OCCUPIED | MAINTENANCE | RESERVED"
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    RESIDENT_STAYS {
        uuid id PK
        uuid owner_id FK
        uuid property_id FK
        uuid resident_id FK
        uuid bed_id FK
        date check_in_date
        date expected_check_out_date
        date actual_check_out_date
        numeric agreed_monthly_rent
        numeric security_deposit_amount
        varchar deposit_status "PENDING | PAID | REFUNDED"
        varchar stay_status "ACTIVE | NOTICE_GIVEN | CHECKED_OUT"
        timestamptz created_at
        timestamptz updated_at
    }

    RENT_INVOICES {
        uuid id PK
        uuid owner_id FK
        uuid property_id FK
        uuid resident_id FK
        uuid stay_id FK
        varchar invoice_number UK
        date billing_month
        numeric base_rent
        numeric utility_charges
        numeric penalty_fee
        numeric total_amount
        numeric paid_amount
        varchar currency
        varchar status "DRAFT | ISSUED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED"
        date due_date
        timestamptz paid_at
        timestamptz created_at
        timestamptz updated_at
    }

    PAYMENTS {
        uuid id PK
        uuid owner_id FK
        uuid resident_id FK
        uuid invoice_id FK
        uuid merchant_account_id FK
        varchar idempotency_key UK
        varchar payment_method "RAZORPAY | CASH | UPI_MANUAL"
        numeric amount
        varchar currency
        varchar razorpay_order_id UK
        varchar razorpay_payment_id UK
        varchar razorpay_signature
        varchar status "CREATED | AUTHORIZED | CAPTURED | FAILED | REFUNDED"
        text failure_reason
        timestamptz paid_at
        timestamptz created_at
        timestamptz updated_at
    }

    RAZORPAY_WEBHOOK_EVENTS {
        uuid id PK
        varchar razorpay_event_id UK
        varchar razorpay_merchant_id
        varchar event_type
        jsonb payload
        boolean signature_verified
        varchar processing_status
        timestamptz processed_at
        timestamptz created_at
    }

    COMPLAINTS {
        uuid id PK
        uuid owner_id FK
        uuid property_id FK
        uuid resident_id FK
        uuid stay_id FK
        varchar title
        text description
        varchar category
        varchar priority "LOW | MEDIUM | HIGH | URGENT"
        varchar status "OPEN | IN_PROGRESS | RESOLVED | CLOSED"
        text resolution_notes
        timestamptz resolved_at
        timestamptz created_at
        timestamptz updated_at
    }

    FCM_DEVICE_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar device_token UK
        varchar platform "ANDROID"
        varchar app_version
        boolean is_active
        timestamptz last_seen_at
        timestamptz created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid owner_id FK
        uuid actor_id FK
        varchar actor_role
        varchar action
        varchar entity_name
        varchar entity_id
        varchar ip_address
        jsonb metadata
        timestamptz created_at
    }
```

---

## 3. Detailed Table Specifications

### 3.1 `users` (Updated for Firebase Phone OTP & 2-Role Model)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Internal immutable user UUID |
| `firebase_uid` | `VARCHAR(128)` | `UNIQUE, NULLABLE` | Verified Firebase Auth UID (null for pre-invited residents prior to first OTP login) |
| `phone` | `VARCHAR(20)` | `NOT NULL, UNIQUE` | E.164 phone number (`+91...`) verified by Firebase OTP |
| `email` | `VARCHAR(255)` | `NULLABLE, UNIQUE` | Optional contact email for receipts |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Display name |
| `role` | `VARCHAR(20)` | `NOT NULL, CHECK (role IN ('OWNER', 'RESIDENT'))` | Strict 2-role isolation |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Account suspension flag |
| `is_verified` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Verified via Firebase OTP |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update timestamp |

### 3.2 `owner_merchant_accounts` (Independent PG Owner Razorpay Account)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Merchant integration ID |
| `owner_id` | `UUID` | `NOT NULL, UNIQUE, FK -> users(id)` | 1-to-1 binding to PG Owner |
| `integration_mode` | `VARCHAR(30)` | `NOT NULL` | `PARTNER_OAUTH` or `ROUTE_LINKED_ACCOUNT` |
| `razorpay_merchant_id` | `VARCHAR(64)` | `UNIQUE, NULLABLE` | Owner's Razorpay Merchant ID (`merch_...`) |
| `razorpay_linked_account_id` | `VARCHAR(64)` | `UNIQUE, NULLABLE` | Used if onboarded via Route (`acc_...`) |
| `public_key_id` | `VARCHAR(100)` | `NULLABLE` | Public Razorpay Key ID safe to pass to Android Checkout |
| `encrypted_oauth_access_token` | `TEXT` | `NULLABLE` | AES-256-GCM encrypted Razorpay Partner OAuth access token |
| `encrypted_oauth_refresh_token` | `TEXT` | `NULLABLE` | AES-256-GCM encrypted OAuth refresh token |
| `encrypted_key_secret` | `TEXT` | `NULLABLE` | AES-256-GCM encrypted key secret (never exposed) |
| `encrypted_webhook_secret` | `TEXT` | `NULLABLE` | AES-256-GCM encrypted webhook HMAC secret |
| `token_expires_at` | `TIMESTAMPTZ` | `NULLABLE` | OAuth token expiry timestamp |
| `onboarding_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'NOT_STARTED'` | `NOT_STARTED`, `PENDING_KYC`, `ACTIVATED`, `SUSPENDED` |
| `bank_account_last4` | `VARCHAR(4)` | `NULLABLE` | Masked last 4 digits of Owner's settlement bank account |
| `bank_ifsc` | `VARCHAR(15)` | `NULLABLE` | Registered bank IFSC |
| `bank_verification_status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'UNVERIFIED'` | `UNVERIFIED`, `VERIFIED`, `FAILED` |
| `activated_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp Razorpay approved live payouts |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |

### 3.3 `rent_invoices`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique Invoice ID |
| `owner_id` | `UUID` | `NOT NULL, FK -> users(id)` | Multi-tenant Owner scope |
| `property_id` | `UUID` | `NOT NULL, FK -> properties(id)` | PG Property ID |
| `resident_id` | `UUID` | `NOT NULL, FK -> users(id)` | Billed Resident ID |
| `stay_id` | `UUID` | `NOT NULL, FK -> resident_stays(id)` | Associated Stay ID |
| `invoice_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Formatted number (e.g. `INV-202611-00042`) |
| `billing_month` | `DATE` | `NOT NULL` | First day of billing month (`2026-11-01`) |
| `base_rent` | `NUMERIC(10, 2)` | `NOT NULL` | Monthly rent amount in INR |
| `utility_charges` | `NUMERIC(10, 2)` | `NOT NULL, DEFAULT 0.00` | Electricity / water add-ons |
| `penalty_fee` | `NUMERIC(10, 2)` | `NOT NULL, DEFAULT 0.00` | Late payment fee |
| `total_amount` | `NUMERIC(10, 2)` | `NOT NULL` | `base_rent + utility_charges + penalty_fee` |
| `paid_amount` | `NUMERIC(10, 2)` | `NOT NULL, DEFAULT 0.00` | Settled amount |
| `currency` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | ISO 4217 currency code |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ISSUED'` | `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED` |
| `due_date` | `DATE` | `NOT NULL` | Rent payment deadline |
| `paid_at` | `TIMESTAMPTZ` | `NULLABLE` | Full settlement timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |

### 3.4 `payments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Internal Payment ID |
| `owner_id` | `UUID` | `NOT NULL, FK -> users(id)` | Receiving PG Owner ID |
| `resident_id` | `UUID` | `NOT NULL, FK -> users(id)` | Paying Resident ID |
| `invoice_id` | `UUID` | `NOT NULL, FK -> rent_invoices(id)` | Target Invoice ID |
| `merchant_account_id` | `UUID` | `NULLABLE, FK -> owner_merchant_accounts(id)` | Owner merchant account that received funds |
| `idempotency_key` | `VARCHAR(64)` | `NOT NULL, UNIQUE` | Prevents duplicate order/payment creation |
| `payment_method` | `VARCHAR(20)` | `NOT NULL` | `RAZORPAY`, `CASH`, `UPI_MANUAL` |
| `amount` | `NUMERIC(10, 2)` | `NOT NULL` | Transaction amount in INR |
| `currency` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | Currency |
| `razorpay_order_id` | `VARCHAR(64)` | `UNIQUE, NULLABLE` | Order ID created on Owner's merchant account (`order_...`) |
| `razorpay_payment_id` | `VARCHAR(64)` | `UNIQUE, NULLABLE` | Razorpay Payment ID (`pay_...`) |
| `razorpay_signature` | `VARCHAR(255)` | `NULLABLE` | Verified checkout signature |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'CREATED'` | `CREATED`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `REFUNDED` |
| `failure_reason` | `TEXT` | `NULLABLE` | Sanitized gateway failure code/description |
| `paid_at` | `TIMESTAMPTZ` | `NULLABLE` | Capture timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Audit timestamp |

---

## 4. Indexing & Uniqueness Constraints

1. **Multi-Tenant Query Indices**:
   - `idx_properties_owner`: `(owner_id, is_active)`
   - `idx_rooms_owner_prop`: `(owner_id, property_id, is_active)`
   - `idx_beds_owner_room_status`: `(owner_id, room_id, status)`
   - `idx_stays_owner_status`: `(owner_id, stay_status)`
   - `idx_stays_resident`: `(resident_id, stay_status)`
   - `idx_invoices_owner_status`: `(owner_id, status, due_date)`
   - `idx_invoices_resident_status`: `(resident_id, status)`
   - `idx_payments_owner_date`: `(owner_id, paid_at DESC)`
   - `idx_complaints_owner_status`: `(owner_id, status, priority)`
   - `idx_complaints_resident`: `(resident_id, created_at DESC)`
2. **Idempotency & Anti-Double-Billing Constraints**:
   - Unique index on `rent_invoices(stay_id, billing_month)` where `status != 'CANCELLED'` prevents generating two invoices for the same stay in the same month.
   - Unique index on `resident_stays(bed_id)` where `stay_status = 'ACTIVE'` enforces at the PostgreSQL level that two active residents can never occupy the same bed simultaneously.
   - Unique constraints on `payments(idempotency_key)`, `payments(razorpay_order_id)`, `payments(razorpay_payment_id)`, and `razorpay_webhook_events(razorpay_event_id)` prevent duplicate ledger updates.
