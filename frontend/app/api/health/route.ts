import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  let backendStatus = 'UNKNOWN';
  let backendLatencyMs = 0;

  try {
    const start = Date.now();
    const res = await fetch(`${backendUrl}/api/v1/health`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    backendLatencyMs = Date.now() - start;
    backendStatus = res.ok ? 'UP' : `DEGRADED_${res.status}`;
  } catch {
    backendStatus = 'UNREACHABLE';
  }

  const responseBody = {
    status: 'UP',
    service: 'edunexus-frontend',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    dependencies: {
      backend: {
        status: backendStatus,
        url: backendUrl,
        latencyMs: backendLatencyMs,
      },
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
