'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDto, loginApi, registerApi, logoutApi, getProfileApi } from './auth-api';

interface AuthContextType {
  user: UserDto | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<UserDto>;
  register: (email: string, pass: string, fn: string, ln: string) => Promise<UserDto>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    try {
      const profile = await getProfileApi();
      setUser(profile);
      setError(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await loginApi({ email, password: pass });
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, pass: string, fn: string, ln: string) => {
    setError(null);
    try {
      const res = await registerApi({ email, password: pass, firstName: fn, lastName: ln });
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
