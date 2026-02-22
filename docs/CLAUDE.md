
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ELMS (Enterprise Learning Management System) — a full-stack LMS targeting 20,000+ concurrent users with role-based access (Learner, Instructor, Admin, Super Admin).

**Current state:** Architecture and planning phase. The repo contains a detailed 12-phase/40-prompt development plan (`ELMS-Development-Plan.md`) and an interactive architecture diagram (`ELMS-Architecture.html`). No application source code exists yet — implementation follows the plan prompts in order.

## Tech Stack

- **Frontend:** Next.js 14 (App Router, SSR/SSG), TypeScript, Tailwind CSS, Zustand (state), React Query, Axios, React Hook Form + Zod
- **Backend:** Node.js + Express, TypeScript, JWT auth, Zod validation
- **Database:** Supabase (managed PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Docker Compose, GitHub Actions, Vercel (frontend), Supabase Cloud

## Architecture (Three-Tier, Strict Separation)

```
Next.js (3000) → REST/JSON → Node.js/Express (4000) → supabase-js (service_role) → Supabase
```

**Critical rule:** Frontend NEVER writes to Supabase directly. All mutations go through the Node.js backend. The ONLY direct frontend-to-Supabase connection is Realtime WebSockets (anon key, RLS enforced) for live notifications, chat, and leaderboard updates.

## Planned Monorepo Structure

```
elms/
├── frontend/        # Next.js 14 app
├── backend/         # Node.js/Express API
├── shared/          # TypeScript types only (imported by both)
└── package.json     # npm workspaces: ["frontend", "backend", "shared"]
```

## Backend Module Pattern

Every feature follows this convention inside `backend/src/modules/{name}/`:
```
{name}.routes.ts       # Express router
{name}.controller.ts   # Request handling
{name}.service.ts      # Business logic + Supabase queries
{name}.validators.ts   # Zod schemas for request validation
```

Modules: auth, courses, content, enrollments, assessments, gamification, certificates, communication, admin.

## Key Backend Middleware Stack

`auth.ts` (JWT via Supabase getUser) → `roles.ts` (requireRole guard) → `validate.ts` (Zod) → `rate-limit.ts` → `error-handler.ts` (global, returns JSON)

## Database

25 PostgreSQL tables with UUIDs, soft deletes, auto-updated timestamps. RLS enabled on all tables (protects Realtime subscriptions). 9 PostgreSQL functions handle auto-grading, points/leveling, leaderboard, course progress, and dashboard stats.

Backend uses `service_role` key (bypasses RLS). Frontend anon key is RLS-restricted.

## Frontend Route Structure

Role-based routing under `(dashboard)/`:
- `/learner/*` — course browsing, learning, assessments, certificates, leaderboard
- `/instructor/*` — course management, question bank, grading, analytics
- `/admin/*` — user management, bundles, audit logs, analytics

Auth pages under `(auth)/`: login, register. Public: landing, certificate verification.

## Development Workflow

Follow `ELMS-Development-Plan.md` prompts sequentially (Phase 0 → Phase 12). Each prompt builds on the previous. Test after each prompt. Git commit after each completed phase.

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
PORT=4000
NODE_ENV=development
```

## Planned Commands (After Phase 0 Setup)

```bash
# Root (npm workspaces)
npm install                    # Install all workspace deps

# Backend
npm run dev -w backend         # tsx watch src/index.ts (port 4000)
npm run build -w backend       # tsc
npm start -w backend           # node dist/index.js

# Frontend
npm run dev -w frontend        # Next.js dev server (port 3000)
npm run build -w frontend      # Next.js production build

# Docker
docker-compose up              # frontend:3000 + backend:4000
```
