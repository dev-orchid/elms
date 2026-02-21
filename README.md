# ELMS — Enterprise Learning Management System

Full-stack LMS with role-based access (Learner, Instructor, Admin, Super Admin).

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js + Express, TypeScript, Zod validation
- **Database:** Supabase (PostgreSQL, Auth, Storage, Realtime)

## Monorepo Structure

```
elms/
├── frontend/     # Next.js app (port 3000)
├── backend/      # Express API (port 4000)
├── shared/       # Shared TypeScript types
└── package.json  # npm workspaces
```

## Getting Started

```bash
# Install all dependencies
npm install

# Start backend (port 4000)
npm run dev -w backend

# Start frontend (port 3000)
npm run dev -w frontend
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

See `.env.example` for all required variables.
