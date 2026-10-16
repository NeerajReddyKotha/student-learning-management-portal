'use client';

import React from 'react';
import { useAuth } from '../../../lib/auth-context';
import { ShieldAlert, Users, Server, Activity, GraduationCap, LogOut, Lock } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">EduNexus Academy</h1>
              <p className="text-xs text-purple-400 font-mono">Platform Governance &amp; Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user ? `${user.firstName} ${user.lastName}` : 'Administrator'}</div>
              <div className="text-[11px] text-purple-400 font-mono">ROLE_ADMIN (Superuser)</div>
            </div>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 p-6 rounded-2xl">
          <div className="inline-block px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-medium mb-2">
            System Administration &bull; Security Oversight
          </div>
          <h2 className="text-2xl font-bold text-white">Platform Governance Console</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Audit user permissions, grant trainer faculty privileges, monitor failed authentication spikes, and inspect security tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">TOTAL USERS</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">1,250</div>
            <div className="text-xs text-slate-500 mt-1">+48 this week</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">ACTIVE TRAINERS</span>
              <GraduationCap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">48</div>
            <div className="text-xs text-slate-500 mt-1">Verified faculty</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">FAILED LOGINS (24H)</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">0 Lockouts</div>
            <div className="text-xs text-slate-500 mt-1">Rate limiting active</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">SYSTEM HEALTH</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">100% UP</div>
            <div className="text-xs text-slate-500 mt-1">Postgres + Spring Boot</div>
          </div>
        </div>
      </main>
    </div>
  );
}
