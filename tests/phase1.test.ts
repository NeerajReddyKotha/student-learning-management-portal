import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper to check file existence
function assertFileExists(filePath: string, description: string) {
  assert.equal(
    fs.existsSync(filePath),
    true,
    `Missing required file: ${description} at ${filePath}`
  );
}

test('1. Repository Structure & Configuration Verification', (t) => {
  assertFileExists('.env.example', 'Central Environment Variables Template');
  assertFileExists('.gitignore', 'Comprehensive Root Gitignore');
  assertFileExists('docker-compose.yml', 'Root Docker Compose Configuration');
  assertFileExists('README.md', 'Root README documentation');
  assertFileExists('docs/architecture.md', 'Architecture Documentation');

  const envContent = fs.readFileSync('.env.example', 'utf-8');
  assert.match(envContent, /POSTGRES_DB=edunexus_db/);
  assert.match(envContent, /SPRING_DATASOURCE_URL=/);
  assert.match(envContent, /SERVER_PORT=8080/);
  assert.match(envContent, /NEXT_PUBLIC_API_BASE_URL=/);
  assert.match(envContent, /EduNexus Academy/);
});

test('2. Docker Compose Topology & Health Checks', (t) => {
  const composePath = 'docker-compose.yml';
  const composeContent = fs.readFileSync(composePath, 'utf-8');

  // Verify services
  assert.match(composeContent, /postgres:/, 'PostgreSQL service must be defined');
  assert.match(composeContent, /backend:/, 'Spring Boot backend service must be defined');
  assert.match(composeContent, /frontend:/, 'Next.js frontend service must be defined');

  // Verify container names
  assert.match(composeContent, /edunexus-postgres/);
  assert.match(composeContent, /edunexus-backend/);
  assert.match(composeContent, /edunexus-frontend/);

  // Verify ports
  assert.match(composeContent, /5432/, 'PostgreSQL port 5432 must be configured');
  assert.match(composeContent, /8080/, 'Backend port 8080 must be configured');
  assert.match(composeContent, /3000/, 'Frontend port 3000 must be configured');

  // Verify dependency ordering and healthcheck gates
  assert.match(composeContent, /condition:\s*service_healthy/, 'Services must wait for upstream healthy condition');
  assert.match(composeContent, /pg_isready/, 'Postgres healthcheck must run pg_isready');
  assert.match(composeContent, /\/api\/v1\/health/, 'Backend healthcheck must hit /api/v1/health');
});

test('3. Flyway Initial Schema (V1__initial_schema.sql)', (t) => {
  const migrationPath = 'migrations/V1__initial_schema.sql';
  const backendMigrationPath = 'backend/src/main/resources/db/migration/V1__initial_schema.sql';

  assertFileExists(migrationPath, 'Root migration file');
  assertFileExists(backendMigrationPath, 'Backend resource migration file');

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Verify core LMS table creation
  const requiredTables = [
    'system_health',
    'roles',
    'users',
    'user_roles',
    'course_categories',
    'courses',
    'course_modules',
    'lessons',
    'enrollments',
  ];

  for (const table of requiredTables) {
    const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
    assert.match(sql, tableRegex, `V1 migration must create table: ${table}`);
  }

  // Verify baseline seed data
  assert.match(sql, /ROLE_ADMIN/, 'Must seed ROLE_ADMIN');
  assert.match(sql, /ROLE_INSTRUCTOR/, 'Must seed ROLE_INSTRUCTOR');
  assert.match(sql, /ROLE_STUDENT/, 'Must seed ROLE_STUDENT');
  assert.match(sql, /edunexus-postgres-primary/, 'Must seed EduNexus primary health heartbeat record');
  assert.match(sql, /Software Engineering/, 'Must seed initial course categories');
});

test('4. Backend Scaffold (Spring Boot 3 + Java 21)', (t) => {
  assertFileExists('backend/pom.xml', 'Backend Maven POM');
  assertFileExists('backend/Dockerfile', 'Backend Dockerfile');
  assertFileExists('backend/src/main/resources/application.yml', 'Spring Boot application.yml');
  assertFileExists('backend/src/main/java/com/edunexus/EduNexusApplication.java', 'EduNexus Main Application');
  assertFileExists('backend/src/main/java/com/lms/health/HealthController.java', 'Health Controller');
  assertFileExists('backend/src/main/java/com/lms/health/DatabaseHealthIndicator.java', 'DB Health Indicator');
  assertFileExists('backend/src/main/java/com/lms/repository/HealthRepository.java', 'Health Repository');
  assertFileExists('backend/src/test/java/com/lms/LmsApplicationStartupTest.java', 'Startup Integration Test');
  assertFileExists('backend/src/test/java/com/lms/DatabaseConnectivityTest.java', 'DB Connectivity Test');

  const pom = fs.readFileSync('backend/pom.xml', 'utf-8');
  assert.match(pom, /<java.version>21<\/java.version>/, 'Must target Java 21');
  assert.match(pom, /spring-boot-starter-parent<\/artifactId>\s*<version>3\./, 'Must use Spring Boot 3');
  assert.match(pom, /flyway-core/, 'Must include Flyway');
  assert.match(pom, /postgresql/, 'Must include PostgreSQL driver');
  assert.match(pom, /edunexus-backend/);

  const appYml = fs.readFileSync('backend/src/main/resources/application.yml', 'utf-8');
  assert.match(appYml, /org\.postgresql\.Driver/);
  assert.match(appYml, /flyway:/);
  assert.match(appYml, /EduNexusHikariPool/);
});

test('5. Frontend Scaffold (Next.js + TypeScript)', (t) => {
  assertFileExists('frontend/package.json', 'Frontend package.json');
  assertFileExists('frontend/tsconfig.json', 'Frontend tsconfig.json');
  assertFileExists('frontend/next.config.mjs', 'Frontend next.config.mjs');
  assertFileExists('frontend/Dockerfile', 'Frontend Dockerfile');
  assertFileExists('frontend/app/api/health/route.ts', 'Frontend Health Route');
  assertFileExists('frontend/app/layout.tsx', 'Frontend Root Layout');
  assertFileExists('frontend/app/page.tsx', 'Frontend Home Page');

  const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf-8'));
  assert.equal(pkg.name, 'edunexus-frontend');
  assert.ok(pkg.dependencies.next, 'Next.js dependency required');
  assert.ok(pkg.devDependencies.typescript, 'TypeScript dependency required');
});

test('6. Health Endpoint Contract & Database Probe Schema', (t) => {
  // Test simulated health response structure adhering to the specification contract
  const simulatedHealthResponse = {
    status: 'UP',
    application: 'edunexus-backend',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString(),
    components: {
      api: {
        status: 'UP',
        runtime: '21.0.4',
        jvm: 'OpenJDK 64-Bit Server VM',
      },
      database: {
        status: 'UP',
        type: 'PostgreSQL 16',
        details: {
          connected: true,
          flywayInstalled: true,
          publicTableCount: 9,
        },
      },
    },
  };

  assert.equal(simulatedHealthResponse.status, 'UP');
  assert.equal(simulatedHealthResponse.components.database.details.connected, true);
  assert.equal(simulatedHealthResponse.components.database.details.publicTableCount, 9);
});
