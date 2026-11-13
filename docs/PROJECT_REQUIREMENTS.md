# Project Requirements: PG Management SaaS

## 1. Executive Summary
**PG Management SaaS** is a multi-tenant Paying Guest (PG) and Hostel management platform engineered for Android mobile users, powered by a modular monolithic Java Spring Boot backend and a multi-tenant PostgreSQL database.

The platform connects two primary user personas:
1. **OWNER**: PG property owners who manage properties, rooms, beds, resident onboarding, automated rent invoicing, payment records, complaints, and their own Razorpay merchant account.
2. **RESIDENT**: PG occupants who access their assigned PG stay, view monthly rent invoices, pay rent directly through Razorpay, receive digital receipts, and manage maintenance complaints.

---

## 2. Workspace Gap Analysis (Current State vs. Target Architecture)

| Component | Current Workspace State | Target Production Architecture |
|---|---|---|
| **Mobile Platform** | Expo `~52.0.0`, React Native `0.76.3`, `newArchEnabled: true`. | Expo Prebuild / Android Dev Client (`npx expo prebuild --platform android`) to support native Firebase & Razorpay SDKs. |
| **Authentication** | Email + Password (`AuthController`, `AuthService`, `BCryptPasswordEncoder(12)`). | Firebase Phone OTP (client SDK + Firebase Admin ID Token verification on backend) issuing stateless HMAC-SHA512 JWT access & refresh tokens. |
| **User Roles** | 4 roles in `Role.java` (`ROLE_SUPER_ADMIN`, `ROLE_PROPERTY_ADMIN`, `ROLE_STAFF`, `ROLE_TENANT`). | Consolidated strictly to **2 primary roles**: `OWNER` and `RESIDENT` (mapping/migrating existing definitions cleanly). |
| **Backend Layout** | Flat layered packages (`controller`, `service`, `repository`, `entity`). | **Modular Monolith** organized into isolated vertical domain modules (`identity`, `property`, `resident`, `billing`, `payment`, `complaint`, `notification`, `audit`). |
| **Payments** | Not implemented. | **Independent PG Owner Merchant-Account Architecture** via Razorpay approved integration & onboarding; rent settles directly into each Owner's Razorpay merchant account and registered bank account. |
| **Notifications** | Not implemented. | Firebase Cloud Messaging (FCM) via Firebase Admin SDK for real-time payment receipts, invoice alerts, and complaint updates. |
| **Database Schema** | `organizations`, `users`, `properties`, `rooms`, `beds`, `tenant_stays` in `init.sql`. | Versioned migrations (Flyway) adding `owner_merchant_accounts`, `rent_invoices`, `payments`, `razorpay_webhook_events`, `complaints`, `fcm_device_tokens`, `audit_logs`, and `firebase_uid`. |

---

## 3. Stakeholders & Role Matrix

### 3.1 OWNER (`ROLE_OWNER`)
- Authenticate via Firebase Phone OTP and complete owner profile setup.
- Onboard and connect an independent Razorpay merchant account and verified bank account (subject to Razorpay's approved KYC and onboarding flow).
- Create and manage multiple PG properties, floors, rooms, and beds.
- Onboard residents by phone number, assign vacant beds, define monthly rent and security deposits, and manage check-outs.
- Generate, view, and reconcile monthly rent invoices and payment records (including cash/UPI manual mark-as-paid or automated Razorpay settlements).
- View and resolve resident maintenance complaints with status updates and push notifications.

### 3.2 RESIDENT (`ROLE_RESIDENT`)
- Authenticate via Firebase Phone OTP using the phone number registered by their PG owner (or self-sign-up pending owner bed assignment).
- View assigned PG property details, room/bed allocation, house rules, and emergency contacts.
- View itemized monthly rent invoices (base rent, utilities, late fees) and payment history.
- Pay rent directly via Razorpay Android Checkout, settling directly to the assigned PG Owner's Razorpay merchant account.
- File maintenance complaints with category/priority and track status updates via FCM push notifications.

---

## 4. Functional Requirements

### 4.1 Identity & Firebase Phone OTP Authentication
- **FR-AUTH-01**: Users authenticate via phone number and 6-digit OTP handled by Firebase Authentication on React Native Android.
- **FR-AUTH-02**: React Native sends the verified Firebase ID Token to Spring Boot (`POST /api/v1/auth/otp/verify`).
- **FR-AUTH-03**: Spring Boot verifies the Firebase ID Token signature, issuer, expiration, and phone claim via Firebase Admin SDK (`FirebaseAuth.verifyIdToken()`).
- **FR-AUTH-04**: Backend issues short-lived Access JWT (15m) and Refresh Token (7d), stored in Android Keystore via `expo-secure-store`.
- **FR-AUTH-05**: Explicit role selection during first-time registration (`OWNER` vs `RESIDENT`). If a phone number was pre-invited by an Owner as a Resident, the system automatically binds the user to `RESIDENT` and links their active stay.

### 4.2 Property, Room & Bed Inventory (OWNER Scoped)
- **FR-PROP-01**: Owners can create, update, and deactivate PG properties under their `owner_id`.
- **FR-PROP-02**: Hierarchical structure: `Property` -> `Room` (room number, floor, sharing capacity, base rent) -> `Bed` (bed code, status: `VACANT`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`).
- **FR-PROP-03**: Optimistic locking (`@Version`) on `Bed` entities prevents race-condition double allocation of the same bed.

### 4.3 Resident Lifecycle Management
- **FR-RES-01**: Owner onboards a resident by phone number, full name, check-in date, agreed monthly rent, security deposit, and vacant `bed_id`.
- **FR-RES-02**: System validates that the target `bed_id` belongs to a property owned by the requesting `OWNER` (IDOR prevention).
- **FR-RES-03**: Resident can view their active stay summary, PG address, room/bed number, and lease terms, and submit move-out notice requests.

### 4.4 Independent PG Owner Razorpay Merchant Architecture
- **FR-PAY-01 (No Platform Custody)**: The SaaS platform MUST NOT pool or hold resident rent funds in a shared master account for manual disbursement. Rent payments MUST settle directly into each PG Owner's own Razorpay merchant account and registered bank account.
- **FR-PAY-02 (Approved Onboarding & Status Gate)**: Owners complete Razorpay's approved merchant onboarding (via Razorpay Partner OAuth 2.0 / Linked Account onboarding workflow). Rent payment orders cannot be initiated for a property until its Owner's `merchant_status` is `ACTIVE` and bank settlement verification is approved by Razorpay.
- **FR-PAY-03 (Order Creation)**: When a Resident initiates payment for an unpaid `RentInvoice`, the backend verifies that the invoice belongs to the Resident (`resident_id == currentUser.id`), retrieves the PG Owner's Razorpay merchant credentials/account identifier, and creates a Razorpay Order directly on that Owner's Razorpay merchant account.
- **FR-PAY-04 (Cryptographic Verification & Webhooks)**: Payment completion requires both client signature verification (`HMAC-SHA256(order_id + "|" + payment_id)`) AND asynchronous Razorpay webhook verification (`X-Razorpay-Signature`) before marking the invoice `PAID`.
- **FR-PAY-05 (Idempotency)**: Duplicate webhook deliveries or repeated payment confirmation calls must be safely deduplicated via unique `razorpay_payment_id` and `idempotency_key` database constraints.

### 4.5 Rent Invoicing & Ledger
- **FR-INV-01**: Scheduled batch job generates monthly invoices for all `ACTIVE` stays on the owner's configured billing day, or Owners can trigger manual invoice generation.
- **FR-INV-02**: Invoice statuses: `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`.
- **FR-INV-03**: Immutable payment ledger recording payment method (`RAZORPAY`, `CASH`, `UPI_MANUAL`), Razorpay IDs, timestamps, and receipt numbers.

### 4.6 Complaints & Maintenance Desk
- **FR-CMP-01**: Residents submit maintenance complaints (`PLUMBING`, `ELECTRICAL`, `WIFI`, `HOUSEKEEPING`, `FOOD`, `OTHER`) scoped strictly to their assigned `property_id` and `stay_id`.
- **FR-CMP-02**: Owners view complaints across their properties and transition statuses (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`) with resolution remarks.

### 4.7 Firebase Cloud Messaging (FCM) Notifications
- **FR-FCM-01**: Mobile app registers its Android FCM device token with backend (`POST /api/v1/notifications/devices`) upon login and on token refresh.
- **FR-FCM-02**: Automated push notifications dispatched asynchronously on key domain events:
  - Resident receives push notification when a monthly rent invoice is issued or overdue.
  - Owner and Resident receive push notifications when Razorpay payment is captured.
  - Resident receives push notification when Owner updates a complaint status.
  - Owner receives push notification when a Resident files a new complaint.

---

## 5. Non-Functional Requirements

### 5.1 Multi-Tenant Security & Data Isolation
- **NFR-SEC-01**: Every tenant-owned record (`properties`, `rooms`, `beds`, `stays`, `rent_invoices`, `payments`, `complaints`) carries `owner_id`. Every repository query initiated by an `OWNER` MUST enforce `WHERE owner_id = :authenticatedOwnerId`.
- **NFR-SEC-02**: Every query initiated by a `RESIDENT` MUST enforce `WHERE resident_id = :authenticatedResidentId` (preventing cross-resident and cross-PG data access).
- **NFR-SEC-03**: Owner Razorpay API secrets / OAuth tokens MUST be encrypted at rest in PostgreSQL using AES-256-GCM envelope encryption and NEVER returned in any REST response or sent to the mobile client.
- **NFR-SEC-04**: Strict Bucket4j rate limiting: 5 req/min on OTP/Auth routes, 60 req/min on general routes, plus dedicated signature validation on public webhook endpoints.
- **NFR-SEC-05**: Production error responses mask stack traces and SQL exceptions via `GlobalExceptionHandler`.

### 5.2 Performance & Reliability
- **NFR-REL-01**: P95 API latency under 250ms for mobile list/detail endpoints.
- **NFR-REL-02**: All database schema changes managed deterministically via Flyway migrations (`ddl-auto: validate` in production).
- **NFR-REL-03**: Payment webhook processing uses database row-level locking and idempotency keys to guarantee zero duplicate ledger entries.
