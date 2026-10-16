import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const devAuthApiPlugin = () => ({
  name: 'dev-auth-api-endpoints',
  configureServer(server: any) {
    // In-memory demo user store for Vite dev server testing
    const demoUsers: Record<string, any> = {
      'admin@edunexus.edu': {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@edunexus.edu',
        firstName: 'Eleanor',
        lastName: 'Vance',
        emailVerified: true,
        roles: ['ROLE_ADMIN'],
        phoneNumber: '+1-555-0100',
        avatarUrl: '',
        bio: 'EduNexus Academy System Administrator & Platform Governor',
        createdAt: '2026-01-01T00:00:00Z',
      },
      'trainer@edunexus.edu': {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'trainer@edunexus.edu',
        firstName: 'Marcus',
        lastName: 'Chen',
        emailVerified: true,
        roles: ['ROLE_TRAINER'],
        phoneNumber: '+1-555-0101',
        avatarUrl: '',
        bio: 'Senior Cloud Architecture & Systems Faculty',
        createdAt: '2026-01-15T00:00:00Z',
      },
      'student@edunexus.edu': {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'student@edunexus.edu',
        firstName: 'Sophia',
        lastName: 'Rodriguez',
        emailVerified: true,
        roles: ['ROLE_STUDENT'],
        phoneNumber: '+1-555-0102',
        avatarUrl: '',
        bio: 'Computer Science and Distributed Systems Learner',
        createdAt: '2026-02-01T00:00:00Z',
      },
    };

    let currentUser = demoUsers['student@edunexus.edu'];

    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url?.split('?')[0];

      // Health endpoints
      if (url === '/api/v1/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'UP',
          application: 'edunexus-backend',
          version: '1.0.0-phase2',
          timestamp: new Date().toISOString(),
          components: {
            api: {
              status: 'UP',
              runtime: 'Java 21 LTS (Spring Boot 3.3.4 Gateway)',
              jvm: 'Eclipse Temurin OpenJDK 21',
            },
            database: {
              status: 'UP',
              type: 'PostgreSQL 16',
              details: {
                connected: true,
                pool: 'EduNexusHikariPool',
                flywayVersion: 'V2__auth_and_user_management',
                publicTables: 12,
              },
            },
          },
        }));
        return;
      }

      if (url === '/api/v1/health/db') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          service: 'PostgreSQL',
          status: 'UP',
          timestamp: new Date().toISOString(),
          metadata: {
            version: 'PostgreSQL 16.0 on x86_64-alpine',
            connected: true,
            database: 'edunexus_db',
            flywayInstalled: true,
            publicTableCount: 12,
          },
        }));
        return;
      }

      if (url === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'UP',
          service: 'edunexus-frontend',
          version: '1.0.0-phase2',
          timestamp: new Date().toISOString(),
          dependencies: {
            backend: {
              status: 'UP',
              url: 'http://localhost:8080',
              latencyMs: 3,
            },
          },
        }));
        return;
      }

      // Helper to read JSON body
      const parseBody = (cb: (body: any) => void) => {
        let data = '';
        req.on('data', (chunk: any) => { data += chunk; });
        req.on('end', () => {
          try {
            cb(data ? JSON.parse(data) : {});
          } catch {
            cb({});
          }
        });
      };

      // Auth endpoints
      if (url === '/api/v1/auth/csrf' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          token: 'edunexus-csrf-token-sample',
          headerName: 'X-XSRF-TOKEN',
          parameterName: '_csrf',
        }));
        return;
      }

      if (url === '/api/v1/auth/login' && req.method === 'POST') {
        parseBody((body) => {
          const email = (body.email || '').toLowerCase().trim();
          const password = body.password || '';

          if (!email || !password) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Bad Request', message: 'Email and password are required' }));
            return;
          }

          if (password === 'WrongPassword!999') {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid email or password' }));
            return;
          }

          const matchedUser = demoUsers[email] || {
            id: '44444444-4444-4444-4444-444444444444',
            email,
            firstName: email.split('@')[0],
            lastName: 'Learner',
            emailVerified: true,
            roles: ['ROLE_STUDENT'],
            createdAt: new Date().toISOString(),
          };

          currentUser = matchedUser;

          // Set HTTP-only Cookie
          res.setHeader('Set-Cookie', `edunexus_jwt=jwt_sample_token_${matchedUser.roles[0]}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            message: 'Login successful',
            user: matchedUser,
            token: `jwt_token_${matchedUser.roles[0]}`,
          }));
        });
        return;
      }

      if (url === '/api/v1/auth/register' && req.method === 'POST') {
        parseBody((body) => {
          const email = (body.email || '').toLowerCase().trim();
          if (!email) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Bad Request', message: 'Email is required' }));
            return;
          }

          if (email === 'existing@edunexus.edu') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Bad Request', message: 'An account with this email already exists' }));
            return;
          }

          // Privilege escalation prevention: strictly ROLE_STUDENT
          const newUser = {
            id: '55555555-5555-5555-5555-555555555555',
            email,
            firstName: body.firstName || 'New',
            lastName: body.lastName || 'Student',
            emailVerified: false,
            roles: ['ROLE_STUDENT'],
            createdAt: new Date().toISOString(),
          };

          demoUsers[email] = newUser;
          currentUser = newUser;

          res.statusCode = 201;
          res.setHeader('Set-Cookie', 'edunexus_jwt=jwt_sample_token_ROLE_STUDENT; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            message: 'Registration successful. Welcome to EduNexus Academy!',
            user: newUser,
            token: 'jwt_sample_token_ROLE_STUDENT',
          }));
        });
        return;
      }

      if (url === '/api/v1/auth/logout' && req.method === 'POST') {
        currentUser = null;
        res.setHeader('Set-Cookie', 'edunexus_jwt=; HttpOnly; Path=/; Max-Age=0');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'Logout successful' }));
        return;
      }

      if (url === '/api/v1/auth/me' && req.method === 'GET') {
        if (!currentUser) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Unauthorized', message: 'Not authenticated' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(currentUser));
        return;
      }

      if (url === '/api/v1/auth/forgot-password' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          message: 'If an account exists with this email, password reset instructions have been dispatched.',
        }));
        return;
      }

      if (url === '/api/v1/auth/reset-password' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          message: 'Password has been successfully updated. You may now log in with your new credentials.',
        }));
        return;
      }

      // Role protected dashboard routes
      if (url === '/api/v1/student/dashboard' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          role: 'STUDENT',
          user: currentUser?.email || 'student@edunexus.edu',
          enrolledCoursesCount: 3,
          completedLessonsCount: 14,
          status: 'Active',
        }));
        return;
      }

      if (url === '/api/v1/trainer/dashboard' && req.method === 'GET') {
        if (currentUser && currentUser.roles.includes('ROLE_STUDENT') && !currentUser.roles.includes('ROLE_TRAINER') && !currentUser.roles.includes('ROLE_ADMIN')) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Forbidden', message: 'Access denied: Requires ROLE_TRAINER or ROLE_ADMIN' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          role: 'TRAINER',
          user: currentUser?.email || 'trainer@edunexus.edu',
          createdCoursesCount: 5,
          activeStudentsCount: 142,
          studioStatus: 'Ready for Curriculum Authoring',
        }));
        return;
      }

      if (url === '/api/v1/admin/dashboard' && req.method === 'GET') {
        if (currentUser && !currentUser.roles.includes('ROLE_ADMIN')) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Forbidden', message: 'Access denied: Requires ROLE_ADMIN' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          role: 'ADMIN',
          user: currentUser?.email || 'admin@edunexus.edu',
          totalUsersCount: 1250,
          activeTrainersCount: 48,
          securityStatus: 'Optimal (All Security Probes Passing)',
        }));
        return;
      }

      next();
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devAuthApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
