# EduNexus Academy — Enterprise Learning Management System

Welcome to **EduNexus Academy**, an enterprise cloud-native Learning Management System (LMS) built with Spring Boot 3 (Java 21), PostgreSQL 16, Flyway, and Next.js 14 (TypeScript).

---

## Phase 1 & Phase 2 Implemented Features

### Phase 1: Operational Foundation
- **Multi-Service Architecture**: Next.js 14 standalone frontend (`edunexus-frontend`), Spring Boot 3.3.4 Java 21 backend (`edunexus-backend`), and PostgreSQL 16 database (`edunexus-postgres`).
- **Flyway Migrations**: Automated database migrations (`V1__initial_schema.sql` and `V2__auth_and_user_management.sql`).
- **Orchestration**: Docker Compose with dependency-ordered health check gating (`condition: service_healthy`).
- **Health Probes**: System health, active database `SELECT 1` ping, and Actuator indicators.

### Phase 2: Authentication, Authorization & User Management
- **Registration**: Student enrollment with strict password complexity and privilege escalation blocking (never allows public assignment of `ROLE_TRAINER` or `ROLE_ADMIN`).
- **Authentication**: Secure login issuing signed JWT in **HTTP-only cookie** (`edunexus_jwt`) with `SameSite=Lax`.
- **Role-Based Access Control (RBAC)**: Distinct permissions enforced via Spring Security 6 for `ROLE_STUDENT`, `ROLE_TRAINER`, and `ROLE_ADMIN`.
- **Single-Use Expiring Tokens**: SHA-256 hashed password reset (15m expiry) and email verification (24h expiry) tokens.
- **Security Protections**: CSRF token validation (`CookieCsrfTokenRepository`), brute-force rate-limiting (sliding window), account temporary lockout after 5 failed attempts, and anti-enumeration on password reset.
- **Frontend Views**: Responsive Next.js pages for Login, Registration, Password Recovery, and role-specific dashboard shells (`/student`, `/trainer`, `/admin`).

---

## Pre-Seeded Demo Accounts for Local Testing

| Role | Email | Password | Allowed Dashboards |
|---|---|---|---|
| **Platform Administrator** | `admin@edunexus.edu` | `EduNexus2026!Secure` | `/admin`, `/trainer`, `/student` |
| **Faculty Trainer** | `trainer@edunexus.edu` | `EduNexus2026!Secure` | `/trainer`, `/student` (403 on `/admin`) |
| **Enrolled Student** | `student@edunexus.edu` | `EduNexus2026!Secure` | `/student` (403 on `/trainer` and `/admin`) |

---

## Quickstart via Docker Compose

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and launch all containers
docker compose up -d --build

# 3. Verify container statuses
docker compose ps
```

---

## Authentication & User Management API Endpoints

| Endpoint | Method | Security | Description |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Public | Enrolls new student (assigns `ROLE_STUDENT` only) |
| `/api/v1/auth/login` | `POST` | Public | Authenticates credentials and sets HTTP-only cookie |
| `/api/v1/auth/logout` | `POST` | Public | Clears authentication cookie |
| `/api/v1/auth/me` | `GET` | Authenticated | Retrieves current user security profile |
| `/api/v1/auth/forgot-password` | `POST` | Public | Anti-enumeration password recovery request |
| `/api/v1/auth/reset-password` | `POST` | Public | Updates password using single-use token |
| `/api/v1/auth/verify-email` | `POST` | Public | Validates email address with token |
| `/api/v1/auth/csrf` | `GET` | Public | Retrieves CSRF token for SPA clients |
| `/api/v1/student/dashboard` | `GET` | Role: STUDENT+ | Student learning workspace |
| `/api/v1/trainer/dashboard` | `GET` | Role: TRAINER+ | Faculty curriculum studio |
| `/api/v1/admin/dashboard` | `GET` | Role: ADMIN | System governance console |

---

## Testing Commands

### 1. Run Automated Test Suite (14 / 14 Tests)
```bash
npm test
# Equivalent to: node --test tests/*.test.ts
```
Covers:
- Repository structure, Docker Compose topology, and Flyway V1/V2 integrity.
- Registration privilege escalation prevention (prohibits role injection).
- Password complexity regex validation.
- Anti-enumeration behavior on password reset.
- Single-use and expiring token lifecycle with SHA-256 hashing.
- Role-Based Access Control matrix (STUDENT, TRAINER, ADMIN).
- Sliding window rate limiting thresholds.
- HTTP-only cookie and CSRF security contracts.

### 2. Spring Boot Backend Tests (Requires local Maven & Java 21)
```bash
cd backend
mvn test
```
- Context startup tests (`LmsApplicationStartupTest.java`)
- Database connectivity tests (`DatabaseConnectivityTest.java`)
- Auth controller MockMvc security tests (`AuthControllerTest.java`)

---

## cURL Local Verification Examples

```bash
# 1. Login as Student
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@edunexus.edu","password":"EduNexus2026!Secure"}'

# 2. Test Registration (Privilege escalation block)
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@edunexus.edu","password":"Pass123!Secure","firstName":"Alex","lastName":"Lee","roles":["ROLE_ADMIN"]}'
# -> Note that roles is strictly returned as ["ROLE_STUDENT"]

# 3. Forgot Password (Anti-enumeration)
curl -i -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@edunexus.edu"}'
```
