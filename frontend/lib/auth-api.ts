export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  roles: string[];
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: UserDto;
  token: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function registerApi(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Registration failed');
  }
  return json;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Invalid email or password');
  }
  return json;
}

export async function logoutApi(): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function getProfileApi(): Promise<UserDto> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
}

export async function forgotPasswordApi(email: string): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Password reset failed');
  }
  return json;
}
