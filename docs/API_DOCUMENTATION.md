# API Documentation: PG Management SaaS (v1)

## 1. Base Configuration & Security Protocols

- **Base URL**: `/api/v1`
- **Protocol**: HTTPS (TLS 1.3 + HSTS)
- **Authentication**: Stateless Bearer JWT (`Authorization: Bearer <access_token>`)
- **Roles**:
  - `OWNER`: PG Property Owner (scoped exclusively to `owner_id == currentUser.id`)
  - `RESIDENT`: PG Occupant (scoped exclusively to `resident_id == currentUser.id`)

---

## 2. Standard Response Contracts

### 2.1 Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-11-12T00:50:00Z"
}
```

### 2.2 Error Envelope (`400`, `401`, `403`, `404`, `409`, `429`, `500`)
*(Zero stack traces, SQL errors, or internal implementation hints)*
```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number must be valid E.164 format"
    }
  ],
  "path": "/api/v1/auth/otp/verify",
  "timestamp": "2026-11-12T00:50:00Z"
}
```

---

## 3. Identity & Authentication Module (`/api/v1/auth`)
*Rate Limit: 5 requests / minute per IP.*

### 3.1 Verify Firebase Phone OTP & Issue Backend Tokens
- **Endpoint**: `POST /api/v1/auth/otp/verify`
- **Access**: Public
- **Request**:
```json
{
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "fullName": "Rajesh Sharma",
  "preferredRole": "OWNER"
}
```
*(Note: If the verified phone number already has an active Resident invitation/stay created by an Owner, the backend enforces `RESIDENT` role regardless of `preferredRole`.)*
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Phone OTP verified",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "expiresIn": 900,
    "isNewUser": false,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "phone": "+919876543210",
      "fullName": "Rajesh Sharma",
      "role": "OWNER"
    }
  }
}
```

### 3.2 Refresh Access Token
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Access**: Public (with valid non-revoked Refresh Token)
- **Request**: `{ "refreshToken": "..." }`

### 3.3 Logout (Revoke Token)
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: `OWNER`, `RESIDENT`

### 3.4 Get Current Authenticated Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: `OWNER`, `RESIDENT`

---

## 4. Independent PG Owner Merchant Module (`/api/v1/owner/merchant`)
*Strictly restricted to `OWNER`. Enables direct-to-owner bank settlement via Razorpay.*

### 4.1 Get Razorpay Partner OAuth Authorization URL
- **Endpoint**: `GET /api/v1/owner/merchant/razorpay/connect-url`
- **Access**: `OWNER`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://auth.razorpay.com/authorize?client_id=...&state=signed_csrf_nonce",
    "expiresInSeconds": 600
  }
}
```

### 4.2 Complete Razorpay OAuth Callback
- **Endpoint**: `POST /api/v1/owner/merchant/razorpay/callback`
- **Access**: `OWNER`
- **Request**: `{ "code": "rzp_auth_code_123", "state": "signed_csrf_nonce" }`
- **Behavior**: Exchanges authorization code with Razorpay Partner API, validates merchant KYC & bank status, encrypts tokens with AES-256-GCM, and saves to `owner_merchant_accounts`. Never returns raw tokens.

### 4.3 Get Merchant Onboarding & Bank Verification Status
- **Endpoint**: `GET /api/v1/owner/merchant/status`
- **Access**: `OWNER`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "integrationMode": "PARTNER_OAUTH",
    "razorpayMerchantId": "merch_N9X2k81aBc",
    "onboardingStatus": "ACTIVATED",
    "bankVerificationStatus": "VERIFIED",
    "bankAccountLast4": "4821",
    "bankIfsc": "HDFC0001234",
    "readyToAcceptRent": true
  }
}
```

---

## 5. Property, Room & Bed Module (`/api/v1/owner/properties`)
*Strictly restricted to `OWNER`. Scoped by `owner_id == currentUser.id`.*

### 5.1 List Owner Properties
- **Endpoint**: `GET /api/v1/owner/properties`
- **Access**: `OWNER`

### 5.2 Create Property
- **Endpoint**: `POST /api/v1/owner/properties`
- **Access**: `OWNER`
- **Request**:
```json
{
  "name": "Sunrise Residency - Koramangala",
  "propertyType": "PG_COED",
  "addressLine1": "12th Main, 4th Block",
  "city": "Bengaluru",
  "state": "Karnataka",
  "postalCode": "560034",
  "emergencyContact": "+919876543210",
  "defaultBillingDay": 1,
  "gracePeriodDays": 5,
  "lateFeeAmount": 250.00,
  "amenities": ["WIFI", "AC", "FOOD_3X", "CCTV"]
}
```

### 5.3 Create Room & Generate Beds
- **Endpoint**: `POST /api/v1/owner/properties/{propertyId}/rooms`
- **Access**: `OWNER`
- **Request**:
```json
{
  "roomNumber": "204",
  "floorNumber": 2,
  "sharingType": "DOUBLE",
  "baseMonthlyRent": 9500.00,
  "hasAttachedBathroom": true,
  "bedCodes": ["204-A", "204-B"]
}
```

### 5.4 Update Bed Status
- **Endpoint**: `PATCH /api/v1/owner/beds/{bedId}/status`
- **Access**: `OWNER`
- **Request**: `{ "status": "MAINTENANCE" }`

---

## 6. Resident Lifecycle Module

### 6.1 Onboard Resident to Bed (`OWNER`)
- **Endpoint**: `POST /api/v1/owner/residents/onboard`
- **Access**: `OWNER`
- **Request**:
```json
{
  "fullName": "Arjun Mehta",
  "phone": "+919123456789",
  "email": "arjun@example.com",
  "bedId": "8b0870f7-b829-4d40-9f22-f674d84f885d",
  "checkInDate": "2026-12-01",
  "agreedMonthlyRent": 9500.00,
  "securityDepositAmount": 15000.00
}
```
- **Behavior**: Creates/links `RESIDENT` user by phone, acquires optimistic lock on `bedId`, marks bed `OCCUPIED`, creates `ACTIVE` stay.

### 6.2 List Owner's Active Residents (`OWNER`)
- **Endpoint**: `GET /api/v1/owner/residents?propertyId={uuid}&status=ACTIVE`
- **Access**: `OWNER`

### 6.3 Check Out Resident (`OWNER`)
- **Endpoint**: `POST /api/v1/owner/stays/{stayId}/checkout`
- **Access**: `OWNER`

### 6.4 View Assigned PG & Stay Summary (`RESIDENT`)
- **Endpoint**: `GET /api/v1/resident/my-pg`
- **Access**: `RESIDENT`
- **Behavior**: Returns strictly the resident's own active PG address, emergency contact, room number, bed code, monthly rent, and owner name.

---

## 7. Billing & Rent Invoices Module

### 7.1 Generate Monthly Invoices (`OWNER`)
- **Endpoint**: `POST /api/v1/owner/invoices/generate`
- **Access**: `OWNER`
- **Request**: `{ "propertyId": "...", "billingMonth": "2026-12-01" }`
- **Behavior**: Generates idempotent monthly invoices for all active stays in the property and triggers `InvoiceIssuedEvent` -> FCM push notification to residents.

### 7.2 List Invoices (`OWNER` vs `RESIDENT`)
- **Owner View**: `GET /api/v1/owner/invoices?status=ISSUED&month=2026-12-01` (scoped by `owner_id`)
- **Resident View**: `GET /api/v1/resident/invoices` (scoped strictly by `resident_id == currentUser.id`)

---

## 8. Payments & Razorpay Direct Settlement Module

### 8.1 Create Razorpay Order for Rent Invoice (`RESIDENT`)
- **Endpoint**: `POST /api/v1/resident/payments/orders`
- **Access**: `RESIDENT`
- **Request**:
```json
{
  "invoiceId": "c1842e90-7d83-4c51-a6e1-118b7e9124af",
  "idempotencyKey": "pay-inv-c1842e90-attempt-1"
}
```
- **Preconditions**:
  1. Invoice belongs to authenticated `RESIDENT` and status is `ISSUED`, `OVERDUE`, or `PARTIALLY_PAID`.
  2. Property's `OWNER` has an `ACTIVATED` Razorpay merchant account.
- **Response `201 Created`** (Returns ONLY public Key ID and Order ID created on the Owner's Razorpay account):
```json
{
  "success": true,
  "data": {
    "paymentId": "9a712b34-...",
    "razorpayOrderId": "order_P9xK2L81mQp",
    "razorpayKeyId": "rzp_live_OwnerPublicKey",
    "amountInPaise": 950000,
    "currency": "INR",
    "merchantName": "Sunrise Residency PG"
  }
}
```

### 8.2 Verify Client Payment Signature (`RESIDENT`)
- **Endpoint**: `POST /api/v1/resident/payments/verify`
- **Access**: `RESIDENT`
- **Request**:
```json
{
  "paymentId": "9a712b34-...",
  "razorpayOrderId": "order_P9xK2L81mQp",
  "razorpayPaymentId": "pay_P9xL9921AbC",
  "razorpaySignature": "4d8f29e1c..."
}
```

### 8.3 Record Offline Payment (`OWNER`)
- **Endpoint**: `POST /api/v1/owner/payments/manual`
- **Access**: `OWNER`
- **Request**: `{ "invoiceId": "...", "paymentMethod": "CASH", "amount": 9500.00, "notes": "Cash receipt #104" }`

### 8.4 Authoritative Razorpay Webhook
- **Endpoint**: `POST /api/v1/webhooks/razorpay`
- **Access**: Public (Authenticated cryptographically via `X-Razorpay-Signature` HMAC-SHA256)
- **Behavior**: Validates signature against decrypted merchant/partner webhook secret, deduplicates via `razorpay_event_id`, updates `payments` to `CAPTURED` and `rent_invoices` to `PAID`, and triggers FCM payment confirmation notifications to both Owner and Resident.

---

## 9. Complaints & Maintenance Module

### 9.1 Submit Complaint (`RESIDENT`)
- **Endpoint**: `POST /api/v1/resident/complaints`
- **Access**: `RESIDENT`
- **Request**:
```json
{
  "title": "Wi-Fi router offline on 2nd floor",
  "description": "No internet connectivity in Room 204 since morning.",
  "category": "WIFI",
  "priority": "HIGH"
}
```

### 9.2 List My Complaints (`RESIDENT`)
- **Endpoint**: `GET /api/v1/resident/complaints`
- **Access**: `RESIDENT`

### 9.3 List Property Complaints (`OWNER`)
- **Endpoint**: `GET /api/v1/owner/complaints?status=OPEN`
- **Access**: `OWNER`

### 9.4 Update Complaint Status (`OWNER`)
- **Endpoint**: `PATCH /api/v1/owner/complaints/{complaintId}`
- **Access**: `OWNER`
- **Request**: `{ "status": "RESOLVED", "resolutionNotes": "Replaced faulty Ethernet patch cable and rebooted access point." }`
- **Behavior**: Triggers `ComplaintStatusUpdatedEvent` -> sends FCM push notification to the filing Resident.

---

## 10. Notifications Module (`/api/v1/notifications`)

### 10.1 Register Android FCM Device Token
- **Endpoint**: `POST /api/v1/notifications/devices`
- **Access**: `OWNER`, `RESIDENT`
- **Request**:
```json
{
  "deviceToken": "fcm_android_token_xyz...",
  "platform": "ANDROID",
  "appVersion": "1.0.0"
}
```
