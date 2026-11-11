# Project Requirements: PG-Management-SaaS

## 1. Executive Summary
**PG-Management-SaaS** is a multi-tenant Paying Guest (PG) and Hostel property management platform designed to automate and secure operations for PG owners, property managers, wardens, and residents (tenants).

The platform comprises:
- **Backend API**: High-performance, zero-trust Spring Boot 3.3+ microservice architecture.
- **Mobile Client**: Cross-platform React Native / Expo application with role-aware interfaces.
- **Infrastructure**: Containerized PostgreSQL, Redis, and reverse proxy with automated health checks.

---

## 2. Core Stakeholders & Roles
1. **Super Admin**: Platform operator managing tenant organizations, system subscriptions, billing, and platform-wide audit logs.
2. **Property Admin (PG Owner)**: Owner/operator managing multiple hostels/properties, room inventories, tariffs, staff, and financial reports.
3. **Property Staff / Warden**: Operational staff handling check-ins, check-outs, maintenance tickets, and daily attendance.
4. **Resident (Tenant)**: Registered occupant accessing rent dues, digital receipts, visitor passes, and maintenance requests.

---

## 3. Functional Requirements (FR)

### 3.1 Authentication & Identity Management
- **FR-AUTH-1**: Multi-factor capable authentication using JWT with short-lived access tokens (15m) and cryptographically secure refresh tokens (7d).
- **FR-AUTH-2**: Password complexity enforcement (minimum 10 characters, mixed case, numbers, special characters).
- **FR-AUTH-3**: Account lockout and exponential backoff after 5 consecutive failed attempts.
- **FR-AUTH-4**: Secure logout invalidating tokens via Redis blacklist.

### 3.2 Property & Inventory Management
- **FR-PROP-1**: Hierarchical property modeling: `Organization` -> `Property` -> `Floor` -> `Room` -> `Bed`.
- **FR-PROP-2**: Real-time room and bed vacancy tracking with occupancy statuses (`VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`, `RESERVED`).
- **FR-PROP-3**: Amenity configuration per property (WiFi, Food, Laundry, AC, Power Backup).

### 3.3 Tenant Lifecycle & Onboarding
- **FR-TEN-1**: Digital tenant onboarding with secure KYC document upload, government ID verification, and emergency contact registry.
- **FR-TEN-2**: Bed allocation with lease agreements, security deposit tracking, and check-in checklists.
- **FR-TEN-3**: Automated rent cycle generation, grace periods, late-fee calculation, and automated invoice PDF generation.
- **FR-TEN-4**: Notice period management, move-out inspections, and deposit refund reconciliation.

### 3.4 Complaints & Maintenance Management
- **FR-CMP-1**: Ticket submission with priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), category tagging, and image attachment.
- **FR-CMP-2**: Staff assignment, status transitions (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), and SLA tracking.

### 3.5 Role-Based Dashboard & Reports
- **FR-REP-1**: Owner dashboard showing monthly revenue, pending receivables, occupancy rates, and expense summaries.
- **FR-REP-2**: Tenant portal for instant rent payment via secure gateway proxy and receipt downloads.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Security & Compliance (Defense-in-Depth)
- **NFR-SEC-1 (Zero Hardcoded Secrets)**: All secrets (DB credentials, JWT signing keys, payment keys) must be injected strictly via environment variables.
- **NFR-SEC-2 (IDOR / BOLA Prevention)**: Strict multi-tenant row-level access control. All queries must enforce `organization_id` or `property_id` scoping tied to the authenticated user.
- **NFR-SEC-3 (XSS & Injection Immunity)**: All inputs sanitized via Bean Validation and parameterized JPA/Hibernate queries.
- **NFR-SEC-4 (Rate Limiting)**: Strict multi-tier rate limiting (Bucket4j/Redis) to protect against DDoS, credential stuffing, and brute force.
- **NFR-SEC-5 (Security Headers)**: Standardized HTTP headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **NFR-SEC-6 (Debug Mode Disabled)**: Complete suppression of server stack traces and internal schema hints in production error payloads.
- **NFR-SEC-7 (Password Hashing)**: Industry-standard BCrypt with work factor 12 (or Argon2id).

### 4.2 Reliability & Performance
- **NFR-REL-1**: 99.9% API uptime with automated Docker health checks.
- **NFR-PERF-1**: P95 API response times under 200ms for read operations and under 400ms for writes.
- **NFR-PERF-2**: Connection pool optimization with HikariCP (max pool size 10, connection timeout 30s).

### 4.3 Maintainability & Code Quality
- Clean Layered Architecture (`Controller` -> `Service` -> `Repository` -> `Entity`).
- Comprehensive DTO boundary mapping (never expose JPA entities in REST endpoints).
