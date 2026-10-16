import React from 'react';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto p-8">
      <header className="mb-12 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">EduNexus Academy &bull; Phase 1 Live</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
          EduNexus Academy Architecture
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Next.js App Router frontend scaffolded with Spring Boot 3 Java 21 backend, PostgreSQL 16 persistence, and Flyway schema migrations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-mono text-emerald-400 mb-2">FRONTEND SERVICE</div>
          <h2 className="text-xl font-bold text-white mb-2">Next.js 14 / TypeScript</h2>
          <p className="text-sm text-slate-300 mb-4">
            Standalone output Dockerized container with App Router, server-side health checks, and responsive Tailwind UI.
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2 rounded text-slate-400">
            Port: 3000 &bull; Route: /api/health
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-mono text-cyan-400 mb-2">BACKEND SERVICE</div>
          <h2 className="text-xl font-bold text-white mb-2">Spring Boot 3 / Java 21</h2>
          <p className="text-sm text-slate-300 mb-4">
            Spring Data JPA, Hibernate 6, Spring Boot Actuator, HikariCP, and REST health controllers with DB liveness probes.
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2 rounded text-slate-400">
            Port: 8080 &bull; Route: /api/v1/health
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-mono text-violet-400 mb-2">PERSISTENCE</div>
          <h2 className="text-xl font-bold text-white mb-2">PostgreSQL 16 &amp; Flyway</h2>
          <p className="text-sm text-slate-300 mb-4">
            Relational storage with versioned SQL migrations (V1 initial schema for users, roles, categories, courses, and health heartbeats).
          </p>
          <div className="text-xs font-mono bg-slate-950 p-2 rounded text-slate-400">
            Port: 5432 &bull; DB: edunexus_db
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <a
          href="/api/health"
          target="_blank"
          className="inline-flex items-center px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
        >
          Check Frontend Health API &rarr;
        </a>
      </div>
    </main>
  );
}
