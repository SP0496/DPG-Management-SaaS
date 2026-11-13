# Implementation Roadmap: PG Management SaaS

## Overview
This roadmap transitions the current inspected workspace (`backend/` Spring Boot 3.3.5, `mobile/` Expo 52 / React Native 0.76.3, `infra/` Docker PostgreSQL 16 + Redis 7) into a production-ready, modular monolithic SaaS platform supporting **OWNER** and **RESIDENT** workflows with **Firebase Phone OTP**, **Independent PG Owner Razorpay Merchant Accounts**, and **Firebase Cloud Messaging (FCM)**.

---

## Phase 0: Modular Monolith Refactoring & Flyway Database Foundation
**Objective**: Reorganize backend packages into isolated domain modules and establish deterministic database migrations before adding new features.

- **Backend Refactoring**:
  - Restructure `com.pgmanagement.saas` into modular packages:
    `modules.identity`, `modules.merchant`, `modules.property`, `modules.resident`, `modules.billing`, `modules.payment`, `modules.complaint`, `modules.notification`, `modules.audit`, and `shared`.
  - Consolidate `Role` enum strictly to `OWNER` and `RESIDENT`.
  - Implement `TenantContext` extracting `authenticatedUserId` and `authenticatedRole` exclusively from verified JWTs.
  - Implement `AesGcmEncryptor` in `shared.security` using an externalized `ENCRYPTION_MASTER_KEY` environment variable.
- **Database Migrations (Flyway)**:
  - Add `flyway-core` and `flyway-database-postgresql` to `backend/pom.xml`.
  - Author `V1__init_schema.sql` and `V2__merchant_billing_complaints_fcm.sql` matching `docs/DATABASE_DESIGN.md` (with `owner_id` & `resident_id` multi-tenant keys and idempotency unique indices).
- **Acceptance Gate**:
  - `mvn clean compile` and Flyway migrations succeed cleanly against `infra/docker-compose.yml` PostgreSQL 16.

---

## Phase 1: Firebase Phone OTP Authentication & Android Prebuild Setup
**Objective**: Replace email/password login as primary auth with Firebase Phone OTP verified server-side, and configure React Native Android for native SDKs.

- **Mobile Native Android Setup**:
  - Add `expo-dev-client`, `@react-native-firebase/app`, and `@react-native-firebase/auth`.
  - Configure `google-services.json` and run `npx expo prebuild --platform android` to generate the native Android Gradle project (`mobile/android/`).
  - Refactor `RootNavigator` to route strictly between `AuthNavigator`, `OwnerNavigator`, and `ResidentNavigator` using the official `#EAF6FF` / `#142B4A` / `#FF8C42` 60-30-10 color palette.
  - Build `PhoneInputScreen`, `OtpVerifyScreen`, and `RoleSelectionScreen`.
- **Backend Identity Module**:
  - Add `com.google.firebase:firebase-admin` to `backend/pom.xml`.
  - Configure Firebase Admin initialization from environment-injected service account credentials (never committed to Git).
  - Implement `POST /api/v1/auth/otp/verify` to verify Firebase ID Tokens, resolve/create `OWNER` or pre-invited `RESIDENT` users, and issue backend HMAC-SHA512 JWTs.
- **Acceptance Gate**:
  - Verified OTP flow on Android emulator issues JWT stored in Android Keystore (`expo-secure-store`); unverified/forged Firebase tokens return `401 Unauthorized`.

---

## Phase 2: Property, Room, Bed & Resident Lifecycle Modules
**Objective**: Enable PG Owners to configure properties/beds and onboard Residents, and enable Residents to view their assigned PG.

- **Backend (`property` & `resident` modules)**:
  - Implement Property, Room, and Bed CRUD scoped strictly by `owner_id`.
  - Implement optimistic locking (`@Version`) on `Bed` allocation during resident onboarding (`POST /api/v1/owner/residents/onboard`).
  - Implement Resident check-out workflow (`POST /api/v1/owner/stays/{stayId}/checkout`) freeing the assigned bed.
  - Implement `GET /api/v1/resident/my-pg` scoped by `resident_id`.
- **Mobile UI**:
  - Owner Screens: `PropertiesListScreen`, `PropertyFormScreen`, `RoomsAndBedsScreen`, `ResidentsListScreen`, `OnboardResidentScreen`.
  - Resident Screens: `MyPgHomeScreen` displaying assigned PG details, room/bed code, and owner contact.
- **Acceptance Gate**:
  - Automated integration tests confirm Owner A cannot read or modify Owner B's properties/beds, and Resident A cannot view Resident B's stay.

---

## Phase 3: Independent PG Owner Razorpay Merchant-Account Architecture
**Objective**: Enable each PG Owner to connect their own approved Razorpay Merchant Account & registered bank account so rent settles directly to them.

- **Backend (`merchant` module)**:
  - Add `com.razorpay:razorpay-java` to `backend/pom.xml`.
  - Implement `OwnerMerchantAccount` entity & `MerchantAccountPort` abstraction.
  - Implement Razorpay Partner OAuth 2.0 flow (`GET /api/v1/owner/merchant/razorpay/connect-url`, `POST /api/v1/owner/merchant/razorpay/callback`) with state CSRF protection and AES-256-GCM encryption of OAuth tokens/secrets.
  - Implement Merchant KYC & Bank Verification status sync (`GET /api/v1/owner/merchant/status`).
- **Mobile UI**:
  - Owner Screen: `MerchantBankSetupScreen` showing onboarding status (`NOT_STARTED`, `PENDING_KYC`, `ACTIVATED`), masked settlement bank account (`****4821`), and secure OAuth WebView/Chrome Custom Tab launcher.
- **Acceptance Gate**:
  - Encrypted tokens stored in PostgreSQL; API never exposes secrets to mobile clients; properties owned by unverified merchants block online invoice payment initiation with clear `409 Conflict`.

---

## Phase 4: Rent Invoicing, Razorpay Direct Checkout & Webhook Ledger
**Objective**: Automate monthly rent invoicing and allow Residents to pay directly into their Owner's Razorpay merchant account.

- **Backend (`billing` & `payment` modules)**:
  - Implement scheduled monthly invoice generator (`@Scheduled`) and manual trigger (`POST /api/v1/owner/invoices/generate`) with unique `(stay_id, billing_month)` idempotency.
  - Implement `POST /api/v1/resident/payments/orders` creating Razorpay Orders on the Property Owner's merchant account using decrypted per-owner credentials.
  - Implement `POST /api/v1/resident/payments/verify` (HMAC-SHA256 verification) and `POST /api/v1/webhooks/razorpay` (`X-Razorpay-Signature` verification + `razorpay_event_id` deduplication).
  - Implement `POST /api/v1/owner/payments/manual` for Cash/UPI receipts.
- **Mobile UI**:
  - Integrate `react-native-razorpay` Android SDK in `ResidentInvoicesScreen` -> native Razorpay Checkout -> receipt confirmation screen.
  - Owner Screens: `OwnerInvoicesScreen` & `PaymentRecordsScreen`.
- **Acceptance Gate**:
  - Razorpay test-mode payment completes end-to-end; duplicate webhook replay does not double-credit invoice `paid_amount`.

---

## Phase 5: Complaints Desk & Firebase Cloud Messaging (FCM)
**Objective**: Complete resident complaint workflows and real-time Android push notifications.

- **Backend (`complaint` & `notification` modules)**:
  - Implement Resident complaint creation/listing and Owner status transition endpoints (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`).
  - Implement `POST /api/v1/notifications/devices` for Android FCM token storage.
  - Implement `@TransactionalEventListener(phase = AFTER_COMMIT)` listeners dispatching FCM notifications via Firebase Admin SDK on `InvoiceIssuedEvent`, `PaymentCapturedEvent`, `ComplaintCreatedEvent`, and `ComplaintStatusUpdatedEvent`.
- **Mobile UI**:
  - Integrate `@react-native-firebase/messaging` for foreground/background Android push handling and Android 13+ notification permissions.
  - Build `ResidentComplaintsScreen` and `OwnerComplaintsScreen`.
- **Acceptance Gate**:
  - End-to-end push delivery confirmed on Android device when invoice is issued, payment is captured, or complaint status changes.

---

## Phase 6: Security Audit, Multi-Tenant Verification & Production Hardening
**Objective**: Validate isolation, resilience, and zero-trust compliance prior to store/production launch.

- **Verification Suite**:
  - Multi-tenant IDOR test suite verifying cross-owner and cross-resident rejection across all endpoints.
  - Rate-limiting verification on OTP and payment endpoints.
  - Dependency vulnerability audit (`mvn` dependency check + `npm audit`).
  - Git secret scan verifying zero exposed `.env`, `google-services.json`, or Firebase service account JSON keys.
- **Release Readiness**:
  - Production profile (`application-prod.yml`), Docker Compose deployment with Nginx TLS 1.3, and signed Android Release APK/AAB build.
