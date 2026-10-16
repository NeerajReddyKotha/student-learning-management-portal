'use client';

import React from 'react';
import { useAuth } from '../../../lib/auth-context';
import { Users, Video, BarChart3, PlusCircle, GraduationCap, LogOut } from 'lucide-react';

export default function TrainerDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">EduNexus Academy</h1>
              <p className="text-xs text-cyan-400 font-mono">Faculty &amp; Trainer Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user ? `${user.firstName} ${user.lastName}` : 'Trainer'}</div>
              <div className="text-[11px] text-cyan-400 font-mono">ROLE_TRAINER</div>
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
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 p-6 rounded-2xl">
          <div className="inline-block px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-mono font-medium mb-2">
            Faculty Studio &bull; Verified Trainer
          </div>
          <h2 className="text-2xl font-bold text-white">Instructor Control Center</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Create curricula, manage lesson cohorts, publish quizzes, and grade student submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">AUTHORED COURSES</span>
              <Video className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-xs text-slate-500 mt-1">2 Active, 3 Draft</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">ACTIVE LEARNERS</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">142</div>
            <div className="text-xs text-slate-500 mt-1">Across all cohorts</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">COMPLETION RATE</span>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">88.4%</div>
            <div className="text-xs text-slate-500 mt-1">Above platform average</div>
          </div>
        </div>
      </main>
    </div>
  );
}
