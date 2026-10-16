-- ==============================================================================
-- Flyway Database Migration: V2__auth_and_user_management.sql
-- Application: EduNexus Academy
-- Description: Phase 2 - Authentication, Authorization, & Security Management
-- ==============================================================================

-- 1. Ensure ROLE_TRAINER role exists alongside ROLE_STUDENT and ROLE_ADMIN
INSERT INTO roles (name, description) VALUES
    ('ROLE_TRAINER', 'EduNexus Academy Certified Instructor and Content Trainer')
ON CONFLICT (name) DO NOTHING;

-- 2. Enhance users table with security and profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Email Verification Tokens (Single-use, expiring)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verification_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);

-- 4. Password Reset Tokens (Single-use, expiring, securely hashed)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens(user_id);

-- 5. User Login Attempts & Security Audit Log
CREATE TABLE IF NOT EXISTS user_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64),
    user_agent VARCHAR(255),
    successful BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON user_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON user_login_attempts(attempted_at);

-- 6. Seed Baseline Demo Accounts for Testing & Development
-- Passwords are encrypted with BCrypt (12 rounds) - value: "EduNexus2026!Secure"
-- $2a$12$6t3XqfS49k0qN23Y.JbYl.d7iCj5/O8x56w/XG.xL85Y6P97h1.4m
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_email_verified, email_verified_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@edunexus.edu', '$2a$12$6t3XqfS49k0qN23Y.JbYl.d7iCj5/O8x56w/XG.xL85Y6P97h1.4m', 'Eleanor', 'Vance', TRUE, TRUE, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'trainer@edunexus.edu', '$2a$12$6t3XqfS49k0qN23Y.JbYl.d7iCj5/O8x56w/XG.xL85Y6P97h1.4m', 'Marcus', 'Chen', TRUE, TRUE, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', 'student@edunexus.edu', '$2a$12$6t3XqfS49k0qN23Y.JbYl.d7iCj5/O8x56w/XG.xL85Y6P97h1.4m', 'Sophia', 'Rodriguez', TRUE, TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Map Demo Accounts to their Roles
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', r.id FROM roles r WHERE r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', r.id FROM roles r WHERE r.name = 'ROLE_TRAINER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', r.id FROM roles r WHERE r.name = 'ROLE_STUDENT'
ON CONFLICT DO NOTHING;
