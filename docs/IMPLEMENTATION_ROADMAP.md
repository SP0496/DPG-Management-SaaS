# Implementation Roadmap: PG-Management-SaaS

## Phase 1: Security Foundation & Infrastructure Baseline (Weeks 1-2)
**Goal**: Establish zero-trust architecture, containerized infrastructure, and hardened security filters before business logic.

- [x] Repository initialization with strict `.gitignore` and `.env.example` templates.
- [x] Docker Compose orchestration (`infra/docker-compose.yml`) for PostgreSQL 16 and Redis 7 with isolated networks.
- [x] Spring Boot 3.3+ backend scaffolding with Maven Wrapper and core dependencies.
- [x] Security Configuration:
  - Spring Security 6 stateless filter chain.
  - JWT token provider with HMAC-SHA512 / RSA asymmetric support.
  - Bucket4j rate-limiting filter with distinct auth vs general limits.
  - Strict CORS policy (no wildcard with credentials).
  - Security response headers (`CSP`, `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  - Production error suppression (zero stack traces leaked).
- [x] Global exception handling and request validation framework (`@Valid`, Bean Validation).

---

## Phase 2: Identity, Organizations & Role-Based Access Control (Weeks 3-4)
**Goal**: Implement tenant registration, authentication, and multi-tenant scoping.

- [ ] Data layer implementation for `organizations` and `users`.
- [ ] BCrypt password hashing (work factor 12) and password policy enforcement.
- [ ] User registration, login, refresh token rotation, and profile endpoints.
- [ ] Method-level security annotations (`@PreAuthorize`) on all controller methods.
- [ ] Account lockout mechanism after 5 failed authentication attempts.
- [ ] Integration tests verifying unauthorized route access rejection (`401`/`403`).

---

## Phase 3: Property & Inventory Domain (Weeks 5-6)
**Goal**: Implement property hierarchy, rooms, beds, and vacancy tracking.

- [ ] Entity models and JPA repositories for `Property`, `Room`, `Bed`.
- [ ] Logical multi-tenancy enforcement in queries (`WHERE organization_id = :orgId`).
- [ ] Property creation, update, and room/bed allocation endpoints.
- [ ] Concurrency-safe bed status transitions (optimistic locking to prevent double booking).

---

## Phase 4: Tenant Onboarding, Stays & Invoicing (Weeks 7-8)
**Goal**: Digitize tenant management, rent generation, and complaints.

- [ ] Tenant onboarding and stay allocation workflow.
- [ ] Scheduled cron job for automated monthly rent invoice generation.
- [ ] Maintenance ticket filing, priority tagging, and staff assignment.
- [ ] Comprehensive audit logging for all write operations.

---

## Phase 5: React Native Mobile Client (Weeks 9-10)
**Goal**: Cross-platform mobile application with role-based navigation.

- [ ] React Native / Expo TypeScript project scaffolding.
- [ ] Secure token storage via `expo-secure-store` / `react-native-keychain`.
- [ ] Centralized Axios API client with automatic token injection and 401 refresh interception.
- [ ] Role-based navigation guards (`AuthNavigator`, `AdminNavigator`, `TenantNavigator`).
- [ ] Form validation and client-side sanitization.

---

## Phase 6: Production Hardening, Audit & Deployment (Weeks 11-12)
**Goal**: Verify all OWASP Top 10 defenses, run automated SAST/DAST, and deploy.

- [ ] Automated dependency vulnerability scanning (`mvn dependency-check`, `npm audit`).
- [ ] Secret detection scan across Git history (`gitleaks` / `trufflehog`).
- [ ] Penetration testing verification:
  - SQL injection & NoSQL injection fuzzing.
  - XSS payload injection.
  - IDOR cross-tenant access attempts.
  - Brute force rate limit triggering.
- [ ] Production deployment pipeline (CI/CD) with immutable Docker images.
