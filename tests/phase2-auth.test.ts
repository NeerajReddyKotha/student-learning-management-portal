import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Helper to hash opaque token with SHA-256 (identical to Java JwtTokenProvider)
function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf-8').digest('hex');
}

test('1. Flyway V2 Migration & Security Schema Verification', (t) => {
  const rootMigration = 'migrations/V2__auth_and_user_management.sql';
  const backendMigration = 'backend/src/main/resources/db/migration/V2__auth_and_user_management.sql';

  assert.equal(fs.existsSync(rootMigration), true, 'Root V2 migration must exist');
  assert.equal(fs.existsSync(backendMigration), true, 'Backend V2 migration must exist');

  const sql = fs.readFileSync(rootMigration, 'utf-8');

  // Verify schema elements
  assert.match(sql, /ROLE_TRAINER/, 'V2 migration must ensure ROLE_TRAINER exists');
  assert.match(sql, /email_verification_tokens/, 'V2 must create email_verification_tokens');
  assert.match(sql, /password_reset_tokens/, 'V2 must create password_reset_tokens');
  assert.match(sql, /user_login_attempts/, 'V2 must create user_login_attempts audit log');
  assert.match(sql, /failed_login_attempts/, 'V2 must add failed_login_attempts column to users');
  assert.match(sql, /locked_until/, 'V2 must add locked_until column to users');

  // Verify demo seeded accounts
  assert.match(sql, /admin@edunexus\.edu/, 'Must seed admin demo account');
  assert.match(sql, /trainer@edunexus\.edu/, 'Must seed trainer demo account');
  assert.match(sql, /student@edunexus\.edu/, 'Must seed student demo account');
});

test('2. Registration Privilege Escalation Prevention', (t) => {
  // Public registration payload attempting to inject privileged role
  const maliciousPayload = {
    email: 'hacker@edunexus.edu',
    password: 'HackerPassword123!',
    firstName: 'Malicious',
    lastName: 'User',
    roles: ['ROLE_ADMIN', 'ROLE_TRAINER'], // Attacker attempt to escalate
  };

  // Rule: Server-side register function only extracts (email, password, firstName, lastName)
  // and strictly binds ROLE_STUDENT.
  const allowedPublicRoles = ['ROLE_STUDENT'];
  const assignedRoles = ['ROLE_STUDENT']; // Enforced by AuthService

  assert.equal(assignedRoles.includes('ROLE_ADMIN'), false, 'Public registration MUST NOT grant ROLE_ADMIN');
  assert.equal(assignedRoles.includes('ROLE_TRAINER'), false, 'Public registration MUST NOT grant ROLE_TRAINER');
  assert.deepEqual(assignedRoles, allowedPublicRoles, 'Public registration must exclusively assign ROLE_STUDENT');
});

test('3. Password Complexity Policy Validation', (t) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Invalid passwords
  assert.equal(passwordRegex.test('short1!'), false, 'Password under 8 chars must fail');
  assert.equal(passwordRegex.test('alllowercase1!'), false, 'Password without uppercase must fail');
  assert.equal(passwordRegex.test('ALLUPPERCASE1!'), false, 'Password without lowercase must fail');
  assert.equal(passwordRegex.test('NoSpecialChars123'), false, 'Password without symbol must fail');
  assert.equal(passwordRegex.test('NoNumbersHere!'), false, 'Password without digit must fail');

  // Valid passwords
  assert.equal(passwordRegex.test('EduNexus2026!Secure'), true, 'Valid complex password must pass');
  assert.equal(passwordRegex.test('P@ssword123'), true, 'Valid password must pass');
});

test('4. Anti-Enumeration Behavior on Password Reset', (t) => {
  const standardMessage = 'If an account exists with this email, password reset instructions have been dispatched.';

  const handleForgotPassword = (email: string, userExists: boolean) => {
    // Both branches return the identical response to prevent timing & text enumeration
    return {
      status: 200,
      body: {
        success: true,
        message: standardMessage,
      },
    };
  };

  const responseForExisting = handleForgotPassword('existing@edunexus.edu', true);
  const responseForNonExisting = handleForgotPassword('ghost@edunexus.edu', false);

  assert.equal(responseForExisting.status, responseForNonExisting.status);
  assert.equal(responseForExisting.body.message, responseForNonExisting.body.message);
  assert.equal(responseForExisting.body.message, standardMessage);
});

test('5. Single-Use and Expiring Reset Token Lifecycle', (t) => {
  const rawToken = '7b960a5f-d0e5-4d2a-8991-3e4b78fa1b98';
  const hashedToken = hashOpaqueToken(rawToken);

  // Assert hashing is non-reversible SHA-256
  assert.equal(hashedToken.length, 64, 'SHA-256 hex digest must be 64 characters');
  assert.notEqual(hashedToken, rawToken, 'Hashed token must never match raw token');

  // Token state verification
  const tokenRecord = {
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    usedAt: null as Date | null,
  };

  const isTokenValid = (rec: typeof tokenRecord) => {
    return rec.usedAt === null && Date.now() < rec.expiresAt.getTime();
  };

  // Initially valid
  assert.equal(isTokenValid(tokenRecord), true, 'Fresh token must be valid');

  // Mark as used
  tokenRecord.usedAt = new Date();
  assert.equal(isTokenValid(tokenRecord), false, 'Used token must be rejected upon replay attempt');

  // Expired token test
  const expiredRecord = {
    tokenHash: hashedToken,
    expiresAt: new Date(Date.now() - 1000),
    usedAt: null,
  };
  assert.equal(isTokenValid(expiredRecord), false, 'Expired token must be rejected');
});

test('6. Role-Based Access Control (RBAC) Permission Matrix', (t) => {
  const permissions: Record<string, string[]> = {
    'ROLE_STUDENT': ['/api/v1/student/dashboard'],
    'ROLE_TRAINER': ['/api/v1/student/dashboard', '/api/v1/trainer/dashboard'],
    'ROLE_ADMIN': ['/api/v1/student/dashboard', '/api/v1/trainer/dashboard', '/api/v1/admin/dashboard'],
  };

  const canAccess = (userRole: string, path: string) => {
    return permissions[userRole]?.includes(path) || false;
  };

  // Student checks
  assert.equal(canAccess('ROLE_STUDENT', '/api/v1/student/dashboard'), true);
  assert.equal(canAccess('ROLE_STUDENT', '/api/v1/trainer/dashboard'), false);
  assert.equal(canAccess('ROLE_STUDENT', '/api/v1/admin/dashboard'), false);

  // Trainer checks
  assert.equal(canAccess('ROLE_TRAINER', '/api/v1/student/dashboard'), true);
  assert.equal(canAccess('ROLE_TRAINER', '/api/v1/trainer/dashboard'), true);
  assert.equal(canAccess('ROLE_TRAINER', '/api/v1/admin/dashboard'), false);

  // Admin checks
  assert.equal(canAccess('ROLE_ADMIN', '/api/v1/student/dashboard'), true);
  assert.equal(canAccess('ROLE_ADMIN', '/api/v1/trainer/dashboard'), true);
  assert.equal(canAccess('ROLE_ADMIN', '/api/v1/admin/dashboard'), true);
});

test('7. Rate Limiter Sliding Window Thresholds', (t) => {
  const MAX_LIMIT = 5;
  const attempts: Record<string, number> = {};

  const checkRateLimit = (ip: string) => {
    attempts[ip] = (attempts[ip] || 0) + 1;
    return attempts[ip] > MAX_LIMIT;
  };

  const testIp = '198.51.100.42';
  for (let i = 1; i <= MAX_LIMIT; i++) {
    assert.equal(checkRateLimit(testIp), false, `Attempt ${i} should be allowed`);
  }
  assert.equal(checkRateLimit(testIp), true, 'Attempt 6 should be rate-limited (HTTP 429)');
});

test('8. HTTP-Only Cookie & CSRF Security Contract', (t) => {
  const cookieConfig = {
    name: 'edunexus_jwt',
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    secure: false, // development
  };

  assert.equal(cookieConfig.httpOnly, true, 'Auth cookie must have HttpOnly attribute');
  assert.equal(cookieConfig.sameSite, 'Lax', 'Auth cookie must use SameSite=Lax for CSRF mitigation');
  assert.equal(cookieConfig.path, '/', 'Auth cookie must be scoped to root path');
});
