export interface SystemHealth {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  application: string;
  version: string;
  timestamp: string;
  components: {
    api?: {
      status: string;
      runtime: string;
      jvm: string;
    };
    database?: {
      status: string;
      type: string;
      details: {
        connected: boolean;
        version?: string;
        flywayInstalled?: boolean;
        publicTableCount?: number;
      };
    };
  };
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function fetchBackendHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchDatabaseHealth(): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health/db`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Database health check failed with status ${response.status}`);
  }
  return response.json();
}
