# EduNexus Academy Architecture Documentation

## 1. System Overview & Vision
**EduNexus Academy** is an enterprise-grade cloud-native Learning Management System (LMS) designed to deliver scalable online higher education, professional certificates, and interactive learning tracks.

The platform architecture spans:
- **Client Tier**: Next.js 14 (App Router, TypeScript, Tailwind CSS, Standalone Docker container).
- **Application Tier**: Spring Boot 3.3.4 (Java 21 LTS, Spring Security 6, Spring Data JPA, Hibernate 6, Actuator, HikariCP).
- **Data Persistence**: PostgreSQL 16 with automated Flyway database schema migrations (V1 Initial + V2 Auth & User Management).
- **Container Infrastructure**: Docker Compose multi-service orchestration with health dependency gating (`service_healthy`).

---

## 2. Component Topology Diagram

```
+-----------------------------------------------------------------------------------+
|                           EDUNEXUS ACADEMY CLIENTS                                |
|                 Web Browsers / Mobile Clients / Enterprise Portals                |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTPS / REST (Port 3000 / 443)
                                          v
+-----------------------------------------------------------------------------------+
|                    FRONTEND SERVICE: edunexus-frontend (Next.js)                   |
|  - Standalone Node runtime (port 3000)                                            |
|  - App Router: /app (layout, pages, components, middleware)                       |
|  - Auth Pages: /login, /register, /forgot-password, /reset-password               |
|  - Protected Dashboards: /student, /trainer, /admin                               |
|  - API Health Probe: /api/health                                                  |
|  - Reverse proxy rewrite: /backend-api/* -> Spring Boot                           |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTP / JSON (Port 8080)
                                          v
+-----------------------------------------------------------------------------------+
|                   APPLICATION BACKEND: edunexus-backend (Spring Boot 3)           |
|  - Java 21 LTS Runtime                                                            |
|  - Spring Security 6 Filter Chain (BCrypt, JWT, HTTP-Only Cookies, CSRF)          |
|  - Rate Limiting Service (IP & Email sliding window)                              |
|  - HikariCP Connection Pool (pool-name: EduNexusHikariPool)                       |
|  - Flyway Database Migration Engine (auto-migrates V1 + V2 schema on boot)        |
|  - Health Indicators: /api/v1/health, /api/v1/health/db, /actuator/health         |
|  - Auth Endpoints: /api/v1/auth/*, /api/v1/users/*, /api/v1/student|trainer|admin  |
+-----------------------------------------------------------------------------------+
                                          |
                                          | JDBC (Port 5432)
                                          v
+-----------------------------------------------------------------------------------+
|                   PERSISTENCE LAYER: edunexus-postgres (PostgreSQL 16)            |
|  - Database: edunexus_db                                                          |
|  - Extensions: uuid-ossp, pgcrypto                                               |
|  - Tables: system_health, roles, users, user_roles, course_categories, courses,   |
|            course_modules, lessons, enrollments, password_reset_tokens,            |
|            email_verification_tokens, user_login_attempts, flyway_schema_history  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Schema & Flyway Migration Strategy

Flyway enforces versioned, immutable database schemas checked into source control:
- **Location**: `backend/src/main/resources/db/migration/` (mirrored at root `/migrations/`).
- **Configuration**: `spring.flyway.baseline-on-migrate: true` to support existing brownfield and clean greenfield instances.

### Migration Summary:
1. **`V1__initial_schema.sql`**:
   - `system_health`: Real-time health heartbeat (`edunexus-postgres-primary`) and telemetry.
   - `roles`: RBAC roles (`ROLE_ADMIN`, `ROLE_INSTRUCTOR`, `ROLE_STUDENT`).
   - `users`: UUID primary keys, Bcrypt password hashes, unique email index.
   - `user_roles`: Many-to-many relationship mapping.
   - `course_categories`: Taxonomies for course discovery (`Software Engineering`, `Cloud & DevOps`, `Data Science & AI`, `Cybersecurity`).
   - `courses`, `course_modules`, `lessons`, `enrollments`.

2. **`V2__auth_and_user_management.sql`**:
   - Seeded `ROLE_TRAINER` for certified instructors.
   - `password_reset_tokens`: SHA-256 hashed single-use tokens expiring in 15 minutes.
   - `email_verification_tokens`: SHA-256 hashed single-use verification tokens expiring in 24 hours.
   - `user_login_attempts`: Audit trail capturing IP address, User-Agent, and success flags.
   - Enhanced `users` table: Added `failed_login_attempts`, `locked_until`, `phone_number`, `avatar_url`, and `bio`.
   - Seeded baseline demo accounts for testing (`admin@edunexus.edu`, `trainer@edunexus.edu`, `student@edunexus.edu`).

---

## 4. Phase 2 Security Architecture & Zero-Trust Policies

### Password Security & Hashing
- Passwords must have minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
- Passwords are encrypted using **BCrypt** with strength factor 12 (`$2a$12$...`).
- Raw passwords and sensitive hashes are never logged or exposed in responses.

### Privilege Escalation Prevention
- Public registration (`POST /api/v1/auth/register`) strictly assigns `ROLE_STUDENT`.
- Even if a client payload maliciously includes elevated roles (`ROLE_TRAINER` or `ROLE_ADMIN`), the server sanitizes the input and exclusively binds the student role.
- Elevation to `ROLE_TRAINER` or `ROLE_ADMIN` can only be performed by existing administrators.

### Anti-Enumeration Protections
- `POST /api/v1/auth/forgot-password` returns the exact same HTTP 200 message whether the account exists or not: *"If an account exists with this email, password reset instructions have been dispatched."*
- Failed logins return generic *"Invalid email or password"* to prevent account harvesting.

### Token Security & Expiration
- Reset tokens and email verification tokens generated via cryptographically secure `UUID.randomUUID()`.
- Opaque tokens are SHA-256 hashed prior to persistence; database dumps cannot be used to hijack accounts.
- Tokens are strictly single-use (`used_at` timestamp check) and time-limited (15 mins for password reset, 24 hours for email verification).

### Session Security & CSRF Defense
- Authentication uses secure, **HTTP-only cookies** (`edunexus_jwt`) with `SameSite=Lax` and `Path=/`.
- Next.js middleware and Spring Security validate tokens seamlessly.
- CSRF protection uses `CookieCsrfTokenRepository.withHttpOnlyFalse()` providing `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header contract.

### Brute-Force Rate Limiting
- `RateLimitingService` tracks login and reset requests using an in-memory sliding window.
- Exceeding 10 attempts per minute per IP or account triggers `HTTP 429 Too Many Requests`.
- 5 consecutive failed passwords lock the user account for 15 minutes (`locked_until`).

---

## 5. Role-Based Access Control (RBAC) Permission Matrix

| Endpoint | Method | Public | STUDENT | TRAINER | ADMIN | Purpose |
|---|---|---|---|---|---|---|
| `/api/v1/health/**` | `GET` | Yes | Yes | Yes | Yes | System telemetry & DB probes |
| `/api/v1/auth/register` | `POST` | Yes | Yes | Yes | Yes | Public student registration |
| `/api/v1/auth/login` | `POST` | Yes | Yes | Yes | Yes | User authentication & JWT cookie |
| `/api/v1/auth/logout` | `POST` | Yes | Yes | Yes | Yes | Invalidate session & clear cookie |
| `/api/v1/auth/me` | `GET` | No | Yes | Yes | Yes | Current user security profile |
| `/api/v1/auth/forgot-password` | `POST` | Yes | Yes | Yes | Yes | Anti-enumeration recovery link |
| `/api/v1/auth/reset-password` | `POST` | Yes | Yes | Yes | Yes | Single-use token password update |
| `/api/v1/auth/verify-email` | `POST` | Yes | Yes | Yes | Yes | Cryptographic email validation |
| `/api/v1/student/**` | `GET` | No | **Yes** | **Yes** | **Yes** | Student learning workspace |
| `/api/v1/trainer/**` | `GET` | No | *403 Forbidden* | **Yes** | **Yes** | Faculty curriculum studio |
| `/api/v1/admin/**` | `GET` | No | *403 Forbidden* | *403 Forbidden* | **Yes** | Governance & user administration |

---

## 6. Docker Compose Network & Healthcheck Lifecycle

```yaml
postgres:
  healthcheck: pg_isready -U edunexus_user -d edunexus_db (10s interval)
backend:
  depends_on:
    postgres:
      condition: service_healthy
  healthcheck: curl -f http://localhost:8080/api/v1/health
frontend:
  depends_on:
    backend:
      condition: service_healthy
  healthcheck: wget -qO- http://localhost:3000/api/health
```
