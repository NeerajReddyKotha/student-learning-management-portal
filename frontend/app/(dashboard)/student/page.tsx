'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { BookOpen, Award, CheckCircle, Clock, GraduationCap, LogOut, User } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">EduNexus Academy</h1>
              <p className="text-xs text-emerald-400 font-mono">Student Learning Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user ? `${user.firstName} ${user.lastName}` : 'Student'}</div>
              <div className="text-[11px] text-slate-400 font-mono">{user?.email}</div>
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
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl">
          <div className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium mb-2">
            Student Enrolled Workspace
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {user?.firstName || 'Learner'}!</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Track your course progress, interactive lab submissions, and upcoming milestone assessments.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">ENROLLED COURSES</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">3</div>
            <div className="text-xs text-slate-500 mt-1">Full-stack &amp; Cloud tracks</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">COMPLETED LESSONS</span>
              <CheckCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">14</div>
            <div className="text-xs text-slate-500 mt-1">Across 4 core modules</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono">CREDENTIAL STATUS</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">On Track</div>
            <div className="text-xs text-slate-500 mt-1">Target graduation: Q4 2026</div>
          </div>
        </div>

        {/* Notice of next milestone */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Next Up: Phase 2 Course Catalog &amp; Syllabus Exploration</h3>
            <p className="text-xs text-slate-400 mt-1">
              Browse interactive courses, curriculum modules, and video stream lessons.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            Catalog Coming in Next Module
          </span>
        </div>
      </main>
    </div>
  );
}
