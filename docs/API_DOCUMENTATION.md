# API Documentation: PG-Management-SaaS (v1)

## 1. Overview & Standard Protocols
All endpoints conform to RESTful architectural constraints and are served exclusively over HTTPS.

- **Base URL**: `/api/v1`
- **Protocol**: HTTPS (HSTS enforced)
- **Data Format**: `application/json; charset=UTF-8`
- **Authentication**: JWT Bearer Token (`Authorization: Bearer <access_token>`)

---

## 2. Global Security Headers
Every response returned by the backend includes the following mandatory security headers:

| Header Name | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none';` | Protects against XSS & framing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Minimizes referrer leakage |
| `Cache-Control` | `no-cache, no-store, max-age=0, must-revalidate` | Prevents caching of sensitive PII |

---

## 3. Rate Limiting Headers
When rate limits are applied, the server provides the following feedback headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the window (e.g., `5` for auth, `60` for general).
- `X-RateLimit-Remaining`: Remaining request quota.
- `Retry-After`: Seconds to wait before retrying (on `429 Too Many Requests`).

---

## 4. Standard Response Formats

### 4.1 Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-11-11T19:50:00Z"
}
```

### 4.2 Standard Error Response (`400`, `401`, `403`, `404`, `429`, `500`)
*(Zero stack traces, internal paths, or database hints leaked)*
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ],
  "path": "/api/v1/auth/login",
  "timestamp": "2026-11-11T19:50:00Z"
}
```

---

## 5. Endpoints Specification

### 5.1 Authentication Endpoints (`/api/v1/auth`)
*Rate limit: 5 requests / minute per IP.*

#### `POST /api/v1/auth/register`
Creates a new property owner account and organization.
- **Access**: Public
- **Request Body**:
```json
{
  "organizationName": "Sunrise Hostels",
  "firstName": "John",
  "lastName": "Doe",
  "email": "owner@sunrisehostels.com",
  "phone": "+919876543210",
  "password": "SecurePassword#2026"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "owner@sunrisehostels.com",
    "role": "ROLE_PROPERTY_ADMIN"
  }
}
```

#### `POST /api/v1/auth/login`
Authenticates a user and returns short-lived access token and refresh token.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "owner@sunrisehostels.com",
  "password": "SecurePassword#2026"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "expiresIn": 900,
    "refreshToken": "d7b0a391-7649-43c2...",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "owner@sunrisehostels.com",
      "role": "ROLE_PROPERTY_ADMIN",
      "organizationId": "e1f1c712-4299-4c11-9a72-7a0c8b06714c"
    }
  }
}
```

#### `GET /api/v1/auth/me`
Retrieves the currently authenticated user's profile.
- **Access**: `ROLE_SUPER_ADMIN`, `ROLE_PROPERTY_ADMIN`, `ROLE_STAFF`, `ROLE_TENANT`

---

### 5.2 Property & Inventory Management (`/api/v1/properties`)
*Rate limit: 60 requests / minute.*

#### `GET /api/v1/properties`
Lists all properties under the authenticated user's organization.
- **Access**: `ROLE_PROPERTY_ADMIN`, `ROLE_STAFF`

#### `POST /api/v1/properties`
Creates a new property branch.
- **Access**: `ROLE_PROPERTY_ADMIN` only
- **Request Body**:
```json
{
  "name": "Sunrise PG - Electronic City Branch",
  "propertyType": "PG_COED",
  "addressLine1": "Plot 42, Phase 1",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560100",
  "emergencyContact": "+919876543299",
  "amenities": ["WIFI", "AC", "FOOD_3X", "BIKE_PARKING", "CCTV"]
}
```

---

### 5.3 Admin Management (`/api/v1/admin`)
*Strictly restricted to Admin roles with audit logging.*

#### `GET /api/v1/admin/dashboard`
Returns high-level business metrics: revenue, total occupancy, vacancy breakdown, outstanding dues.
- **Access**: `ROLE_PROPERTY_ADMIN`, `ROLE_SUPER_ADMIN`

#### `GET /api/v1/admin/audit-logs`
Returns chronologically ordered audit logs for security oversight.
- **Access**: `ROLE_PROPERTY_ADMIN` (org-scoped), `ROLE_SUPER_ADMIN` (platform-wide)

---

### 5.4 Tenant Management (`/api/v1/tenants`)

#### `POST /api/v1/tenants/onboard`
Onboards a new tenant and assigns an available bed.
- **Access**: `ROLE_PROPERTY_ADMIN`, `ROLE_STAFF`
- **Request Body**:
```json
{
  "firstName": "Alex",
  "lastName": "Smith",
  "email": "alex.smith@example.com",
  "phone": "+919123456780",
  "bedId": "8b0870f7-b829-4d40-9f22-f674d84f885d",
  "checkInDate": "2026-12-01",
  "monthlyRent": 8500.00,
  "securityDeposit": 15000.00
}
```
