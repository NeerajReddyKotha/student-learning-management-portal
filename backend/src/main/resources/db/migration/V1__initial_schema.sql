-- ==============================================================================
-- Flyway Database Migration: V1__initial_schema.sql
-- Application: EduNexus Academy
-- Target Database: PostgreSQL 15+ / 16
-- Description: Phase 1 Initial Schema - Core Identity, Health, & Course Catalog
-- ==============================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. System Health & Heartbeat Table
-- Used by Spring Boot HealthIndicator, Next.js probes, and container orchestrator
CREATE TABLE IF NOT EXISTS system_health (
    id VARCHAR(64) PRIMARY KEY,
    component_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'UP',
    version VARCHAR(32) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Seed initial health record
INSERT INTO system_health (id, component_name, status, version, last_heartbeat, details)
VALUES (
    'edunexus-postgres-primary',
    'EduNexus Academy PostgreSQL Database Engine',
    'UP',
    '16.0',
    CURRENT_TIMESTAMP,
    '{"pool_size": 15, "flyway_version": "V1", "environment": "dev", "app": "EduNexus Academy"}'::jsonb
) ON CONFLICT (id) DO UPDATE 
SET last_heartbeat = CURRENT_TIMESTAMP, status = 'UP';

-- 3. Security & Access Control: Roles
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed baseline roles for EduNexus Academy
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'Platform Administrator with system-wide governance'),
    ('ROLE_INSTRUCTOR', 'EduNexus Academy Faculty & Course Creator'),
    ('ROLE_STUDENT', 'Enrolled learner accessing interactive courses')
ON CONFLICT (name) DO NOTHING;

-- 4. User Accounts Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- 6. Course Categories Table
CREATE TABLE IF NOT EXISTS course_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON course_categories(slug);

-- Seed EduNexus Academy Core Course Categories for Phase 2 readiness
INSERT INTO course_categories (name, slug, description) VALUES
    ('Software Engineering', 'software-engineering', 'Full-stack development, algorithms, system design, and clean architecture'),
    ('Cloud & DevOps', 'cloud-devops', 'Kubernetes, Docker, CI/CD pipelines, and cloud-native infrastructure'),
    ('Data Science & AI', 'data-science-ai', 'Machine learning, generative AI, deep neural networks, and Python data pipelines'),
    ('Cybersecurity', 'cybersecurity', 'Defensive security, ethical hacking, identity governance, and cryptography')
ON CONFLICT (slug) DO NOTHING;

-- 7. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) UNIQUE NOT NULL,
    summary TEXT,
    description TEXT,
    category_id BIGINT REFERENCES course_categories(id) ON DELETE SET NULL,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
    price_cents INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- 8. Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_course_module_order UNIQUE (course_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);

-- 9. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(32) DEFAULT 'VIDEO' NOT NULL,
    duration_seconds INT DEFAULT 0 NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_module_lesson_order UNIQUE (module_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);

-- 10. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_user_course_enrollment UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
