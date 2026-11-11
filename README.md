# PG-Management-SaaS

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React Native](https://img.shields.io/badge/React_Native-Expo_52-blue.svg)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Security](https://img.shields.io/badge/Security-Zero--Trust_Hardened-success.svg)](#security-hardening-matrix)

A high-performance, enterprise-grade, multi-tenant Paying Guest (PG) and Hostel Property Management SaaS application. Built with **Spring Boot 3 (Java 17/21)** on the backend and **React Native (Expo)** on mobile, containerized with **Docker**, and engineered with a comprehensive **Zero-Trust Security Architecture**.

---

## 📁 Repository Structure

```text
PG-Management-SaaS/
│
├── mobile/                      # React Native / Expo Application
│   ├── src/
│   │   ├── api/                 # Hardened Axios client & endpoints
│   │   ├── config/              # Validated environment configuration
│   │   ├── context/             # Global AuthContext & session state
│   │   ├── navigation/          # Role-based route guards (Admin/Tenant)
│   │   ├── screens/             # Sanitized UI screens
│   │   └── utils/               # Hardware keystore & XSS sanitization
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                     # Spring Boot 3 Microservice
│   ├── src/main/java/com/pgmanagement/saas/
│   │   ├── config/              # SecurityConfig, CorsConfig, RateLimiting
│   │   ├── controller/          # REST Controllers with @Valid & @PreAuthorize
│   │   ├── dto/                 # Request & Response contracts
│   │   ├── entity/              # Multi-tenant JPA entities with UUIDs
│   │   ├── exception/           # Global exception handler & sanitized errors
│   │   ├── repository/          # Tenant-scoped JPA repositories
│   │   ├── security/            # JWT HMAC-SHA512, Bucket4j rate limiting
│   │   └── service/             # Scoped business logic & BCrypt hashing
│   ├── src/main/resources/      # application.yml (dev/prod profiles)
│   ├── pom.xml
│   ├── Dockerfile               # Multi-stage non-root container build
│   └── .env.example
│
├── docs/                        # Complete Engineering Documentation
│   ├── PROJECT_REQUIREMENTS.md  # Functional, NFR & stakeholder specs
│   ├── DATABASE_DESIGN.md       # Multi-tenant ER diagrams & schema specs
│   ├── API_DOCUMENTATION.md     # REST endpoint specs & security headers
│   ├── IMPLEMENTATION_ROADMAP.md# Phased milestone delivery roadmap
│   └── SECURITY_AUDIT_REPORT.md # Security audit & defensive verification
│
├── infra/                       # Infrastructure Orchestration
│   ├── docker-compose.yml       # PostgreSQL 16 & Redis 7 isolation
│   └── postgres/
│       └── init.sql             # UUID extensions, schemas & indices
│
├── .gitignore                   # Comprehensive secrets & build exclusions
├── .env.example                 # Root configuration template
└── README.md                    # Project documentation
```

---

## 🛡️ Security Hardening Matrix

| Security Control | Defense Mechanism | Implementation Details |
|---|---|---|
| **Zero Exposed API Keys** | Strict Environment Isolation | No hardcoded secrets anywhere. All credentials injected via `${ENV_VAR}` with fail-fast validation. |
| **Protected Admin Routes** | Spring Security 6 & Method RBAC | Routes protected by `@PreAuthorize("hasRole('ADMIN')")`. Mobile navigation unmounts admin stacks for unprivileged users. |
| **Proper Authentication** | Stateless JWT (HMAC-SHA512) | Short-lived access tokens (15m) + secure refresh tokens (7d). Hardware keystore (`expo-secure-store`) on mobile. |
| **IDOR / Multi-Tenant Isolation** | Scoped Query Enforcement | Logical isolation: all database queries enforce `organization_id` checking tied to the authenticated identity. |
| **Form Sanitization & Anti-XSS** | Jakarta Bean Validation + Zod | `@NotBlank`, `@Email`, regex validation, HTML/script stripping, and strict `Content-Security-Policy`. |
| **Multi-Tier Rate Limiting** | Bucket4j Token Bucket Filter | 5 req/min on `/auth/*` endpoints (prevents brute-force) and 60 req/min on general API routes with `429` status. |
| **Secure CORS Configuration** | Origin Allowlists | Explicit domain allowlist via `CORS_ALLOWED_ORIGINS`. Zero wildcard (`*`) usage with credentials. |
| **Security Response Headers** | Standard Defense Headers | `HSTS` (31536000s), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy`. |
| **Production Debug Suppression** | Sanitized Global Error Handling | `server.error.include-stacktrace: never`. Standardized `GlobalExceptionHandler` masks internal schema and class names. |
| **Secure Password Storage** | BCrypt Work Factor 12 | Salted cryptographic hashing. Passwords never logged, printed, or returned in serialized JSON. |
| **Database Hardening** | Parameterized JPA & Isolation | Automated parameterized queries prevent SQL injection. PostgreSQL container runs in an isolated network with non-root user. |
| **Secret-Free Git History** | Audited Commit History | Zero commits in Git history; strict `.gitignore` prevents future leaks of `.env`, keystores, or keys. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Java**: JDK 17 or higher (`java -version`)
- **Node.js**: v18+ and npm (`node -v`, `npm -v`)
- **Docker**: Docker Engine & Docker Compose (`docker --version`)

### 2. Configure Environment Variables
Copy the template files to create local configurations:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env
```

### 3. Spin Up Infrastructure (PostgreSQL & Redis)
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```
Verify the health status of both containers:
```bash
docker compose -f infra/docker-compose.yml ps
```

### 4. Run Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
The backend API will start at: `http://localhost:8080/api/v1`  
Check health status:
```bash
curl http://localhost:8080/api/v1/health
```

### 5. Run React Native Mobile App
```bash
cd mobile
npm install
npm start
```
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code via Expo Go for physical devices

---

## 🧪 Testing & Verification

Run automated security integration tests:
```bash
cd backend
mvn test
```

Verifies:
- `401 Unauthorized` response when unauthenticated users attempt admin route access.
- Correct injection of all security headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`).
- Rejection of invalid/malformed payloads with `400 Bad Request`.

---

## 📄 Documentation Reference
- [Project Requirements](file:///d:/DPG-Management-SaaS/docs/PROJECT_REQUIREMENTS.md)
- [Database Design](file:///d:/DPG-Management-SaaS/docs/DATABASE_DESIGN.md)
- [API Documentation](file:///d:/DPG-Management-SaaS/docs/API_DOCUMENTATION.md)
- [Implementation Roadmap](file:///d:/DPG-Management-SaaS/docs/IMPLEMENTATION_ROADMAP.md)
- [Security Audit Report](file:///d:/DPG-Management-SaaS/docs/SECURITY_AUDIT_REPORT.md)
