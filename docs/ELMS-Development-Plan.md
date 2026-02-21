# ELMS — Claude Code Development Plan

> **Stack:** Next.js 14 (Frontend) + Node.js/Express (Backend API) + Supabase (Database, Auth, Storage, Realtime)
> **Build Estimate:** ~33 days · 12 Phases · 40 Claude Code Prompts
> **Scale Target:** 20,000+ concurrent users

---

## How to Use This Plan

This is your **exact playbook for Claude Code**. Each phase has numbered prompts — paste them into Claude Code **in order**. Each prompt builds on the previous one. Do not skip phases.

**Rules:**
1. Complete every prompt in a phase before moving to the next
2. Test after each prompt — run the app, verify the feature works
3. If Claude Code produces an error, paste the error back and ask it to fix
4. Git commit after each completed phase

---

## Architecture Decision

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Next.js 14)           │
│  App Router · SSR/SSG · Tailwind · Zustand   │
│  Runs on: localhost:3000 / Vercel            │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST (JSON)
                   ▼
┌─────────────────────────────────────────────┐
│           BACKEND API (Node.js/Express)      │
│  Controllers · Services · Middleware         │
│  JWT validation · Business logic · Cron      │
│  Runs on: localhost:4000 / Docker            │
└──────────────────┬──────────────────────────┘
                   │ supabase-js (service role)
                   ▼
┌─────────────────────────────────────────────┐
│              SUPABASE PLATFORM               │
│  PostgreSQL · Auth · Storage · Realtime      │
│  RLS Policies · DB Functions · Triggers      │
│  Runs on: Supabase Cloud                     │
└─────────────────────────────────────────────┘
```

**Why this split:**
- Next.js handles rendering, static pages, and client-side state — nothing else
- Node.js backend owns ALL business logic, validation, and data access
- Supabase provides managed Postgres, file storage, auth tokens, and realtime
- Frontend NEVER talks to Supabase directly for writes — everything through Node.js API
- Frontend CAN use Supabase Realtime directly for live subscriptions (notifications, chat)

---

## PHASE 0 — Project Setup & Monorepo

### Prompt 0.1 — Initialize Monorepo

```
Create a monorepo for the ELMS project with this structure:

elms/
├── frontend/          # Next.js 14 app
├── backend/           # Node.js/Express API
├── shared/            # Shared TypeScript types
├── package.json       # Root workspace config
└── README.md

Use npm workspaces. Root package.json:
  "workspaces": ["frontend", "backend", "shared"]

1. frontend/ — npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --no-import-alias
   Install: @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query
   react-hook-form @hookform/resolvers zod lucide-react sonner date-fns axios

2. backend/ — New Node.js TypeScript project
   Install: express cors helmet morgan dotenv @supabase/supabase-js zod
   jsonwebtoken multer node-cron puppeteer express-rate-limit
   Dev: typescript ts-node tsx @types/express @types/cors @types/morgan
   @types/jsonwebtoken @types/multer nodemon
   tsconfig: strict, ES2022, NodeNext module

3. shared/ — TypeScript package, types only
   Both frontend and backend import from here

Root .env.example:
  NEXT_PUBLIC_API_URL=http://localhost:4000/api
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  JWT_SECRET=
  PORT=4000
  NODE_ENV=development
```

### Prompt 0.2 — Backend Boilerplate

```
Set up the Express backend in backend/src/:

backend/src/
├── index.ts                    # Entry — starts server
├── app.ts                      # Express app (middleware, routes)
├── config/
│   └── env.ts                  # Zod-validated env vars
├── lib/
│   ├── supabase.ts             # Supabase admin client (service role)
│   └── errors.ts               # AppError, NotFoundError, ValidationError, ForbiddenError
├── middleware/
│   ├── auth.ts                 # JWT verification — extracts user from Bearer token
│   ├── roles.ts                # requireRole('admin','instructor') guard
│   ├── validate.ts             # Zod validation for req.body/params/query
│   ├── error-handler.ts        # Global error handler (sends JSON errors)
│   └── rate-limit.ts           # Rate limiter configs
├── routes/
│   └── index.ts                # Mounts all module routes
├── modules/                    # Feature modules (later phases)
└── utils/
    ├── pagination.ts           # page/limit/offset/total helper
    ├── slug.ts                 # Slug generator from title
    └── audit.ts                # Logs action to audit_logs table

app.ts: helmet, cors, morgan, express.json, mount /api, error handler last.
Health check: GET /api/health → { status: "ok", timestamp }

Auth middleware: extract Bearer token, verify via supabase.auth.getUser(token),
fetch profile for role, attach to req.user = { id, email, role }.
If invalid → 401.

Roles middleware: requireRole(...roles) checks req.user.role. If denied → 403.

Scripts: "dev": "tsx watch src/index.ts", "build": "tsc", "start": "node dist/index.js"
```

### Prompt 0.3 — Frontend Structure & API Client

```
Set up frontend/src/:

frontend/src/
├── app/
│   ├── (auth)/login/page.tsx, register/page.tsx, layout.tsx
│   ├── (dashboard)/layout.tsx, page.tsx
│   │   ├── learner/ (page, courses/page, courses/[slug]/page, my-learning/page,
│   │   │            assessments/[id]/page, certificates/page, leaderboard/page)
│   │   ├── instructor/ (page, courses/page, courses/new/page, courses/[id]/edit/page,
│   │   │               question-bank/page, assessments/[id]/grade/page, analytics/page)
│   │   └── admin/ (page, users/page, courses/page, bundles/page,
│   │              analytics/page, audit-logs/page)
│   ├── verify/[code]/page.tsx
│   ├── layout.tsx, page.tsx
├── components/ui/, course/, assessment/, dashboard/, gamification/, layout/
├── lib/
│   ├── api.ts          # Axios instance → backend, auth interceptor
│   ├── supabase.ts     # Browser client (Realtime only)
│   └── utils.ts
├── hooks/use-auth.ts, use-api.ts
└── stores/auth-store.ts, ui-store.ts

lib/api.ts: Axios with baseURL = NEXT_PUBLIC_API_URL.
Request interceptor: attach Bearer token from auth store.
Response interceptor: on 401 → clear auth, redirect /login.

stores/auth-store.ts (Zustand + persist to localStorage):
State: user, token, isLoading. Actions: setAuth, clearAuth.

Create placeholder pages (default export with page title text).
```

### Prompt 0.4 — Shared Types

```
Create shared/src/types.ts exported from shared/src/index.ts.

Type enums: UserRole, CourseStatus, Difficulty, QuestionType, AssessmentType,
EnrollmentStatus, SubmissionStatus, InstructorRole, ContentType,
NotificationType, Level

Interfaces for all 25 DB tables: Profile, Course, CourseInstructor,
CourseBundle, BundleCourse, Module, Lesson, Enrollment, LessonProgress,
QuestionBankItem, Assessment, AssessmentQuestion, Submission,
SubmissionAnswer, Certificate, Badge, UserBadge, PointsLedger,
ForumThread, ForumPost, Message, Notification, Announcement,
AuditLog, IntegrationConfig

API types: LoginRequest, RegisterRequest, AuthResponse,
CreateCourseRequest, UpdateCourseRequest, CreateQuestionRequest,
CreateAssessmentRequest, SubmitAnswerRequest, GradeSubmissionRequest,
PaginatedResponse<T> = { data: T[], total, page, limit }

Dashboard types: AdminDashboardStats, InstructorDashboardStats, LearnerDashboardStats
Gamification: LeaderboardEntry, PointsEvent

Configure both frontend and backend tsconfig to resolve "shared" package.
```

---

## PHASE 1 — Database Schema

### Prompt 1.1 — All Tables (SQL for Supabase SQL Editor)

```
Generate a complete SQL migration for the ELMS database (Supabase SQL Editor).

Rules: UUIDs for PKs, created_at/updated_at timestamps, soft deletes where noted.
Auto-update trigger for updated_at on every table.

Create 25 tables in FK dependency order:
1. profiles (extends auth.users — id REFERENCES auth.users ON DELETE CASCADE)
   first_name, last_name, email, role (learner/instructor/admin/super_admin),
   avatar_url, bio, is_active, two_factor_enabled, points DEFAULT 0,
   level DEFAULT 'Novice', streak_days DEFAULT 0, last_active_at

2. courses — title, slug UNIQUE, description, thumbnail_url, status (draft/published/archived),
   difficulty, estimated_hours, is_certification_enabled, passing_score, max_enrollments, created_by, published_at

3. course_instructors — PK(course_id, instructor_id), role (lead/assistant/grader)
4. course_bundles — title, description, thumbnail_url, is_sequential, created_by
5. bundle_courses — PK(bundle_id, course_id), sort_order
6. modules — course_id FK, title, description, sort_order, is_published
7. lessons — module_id FK, title, description, content_type, content_url, content_body, duration_minutes, sort_order, is_published, version
8. enrollments — UNIQUE(user_id, course_id), status, progress, completed_at
9. lesson_progress — UNIQUE(user_id, lesson_id), is_completed, completed_at, time_spent_seconds
10. question_bank — course_id FK, category, question_type, question_text, options JSONB, correct_answer, points, difficulty, explanation, created_by
11. assessments — course_id FK, module_id FK nullable, title, type, description, time_limit_minutes, max_attempts, shuffle_questions, passing_score, is_published, available_from, available_until, created_by
12. assessment_questions — PK(assessment_id, question_id), sort_order
13. submissions — assessment_id FK, user_id FK, attempt_number, status, score, total_points, started_at, submitted_at, graded_at, graded_by
14. submission_answers — submission_id FK, question_id FK, answer_text, selected_options JSONB, is_correct, points_awarded, feedback
15. certificates — UNIQUE(user_id, course_id), verification_code UNIQUE, certificate_url, issued_at
16. badges — name, description, icon_url, criteria JSONB
17. user_badges — UNIQUE(user_id, badge_id), earned_at
18. points_ledger — user_id FK, points, reason, reference_id
19. forum_threads — course_id FK, title, created_by, is_pinned, is_locked
20. forum_posts — thread_id FK, parent_id self-ref, content, created_by
21. messages — sender_id, receiver_id, content, is_read
22. notifications — user_id FK, type, title, body, reference_url, is_read
23. announcements — course_id FK nullable, title, content, created_by
24. audit_logs — append-only (NO updated_at/soft delete), user_id, action, resource, resource_id, changes JSONB, ip_address, user_agent
25. integration_configs — provider, config JSONB, is_enabled, created_by

Indexes on all FKs plus: profiles(role), courses(slug,status), enrollments(user_id,course_id), question_bank(course_id,category), submissions(user_id,assessment_id), notifications(user_id,is_read), audit_logs(user_id,action,created_at)
```

### Prompt 1.2 — RLS Policies

```
Generate RLS policies for all ELMS tables (Supabase SQL Editor).

Create helper: get_user_role() returns profiles.role for auth.uid().
Enable RLS on ALL tables.

Key rules:
- profiles: all can read. Own update (no role change). Admin updates anyone.
- courses: published visible to all. Drafts to instructors/admins. Write: instructors+admins.
- modules/lessons: visible if enrolled in published course or instructor/admin. Write: instructors+admins.
- enrollments: own read. Instructors read their courses. Learners self-enroll. Own progress update.
- question_bank: NEVER visible to learners. Instructors for their courses. Admins all.
- assessments: published to enrolled. Write: instructors+admins.
- submissions: own read. Instructors for their courses (grading). Own insert. Instructor update (grading).
- certificates/badges/points: read all (public). Insert: service role only.
- notifications/messages: own only.
- forums: enrolled + instructors + admins read/write. Own edit/delete + instructor moderate.
- audit_logs: admin read only. Service role insert only.
- integration_configs: admin only.

NOTE: Backend uses service_role (bypasses RLS). These policies protect Realtime subscriptions and any direct frontend reads.
```

### Prompt 1.3 — Database Functions

```
Create PostgreSQL functions (Supabase SQL Editor):

1. handle_new_user() trigger — auth.users INSERT → create profiles row
2. calculate_course_progress(user_id, course_id) → NUMERIC — completed/total lessons, updates enrollment
3. auto_grade_submission(submission_id) → JSONB — grade MCQ/true_false/fill_blank, return {score, status}
4. award_points(user_id, points, reason, ref_id) → void — insert ledger, update profile total + level
5. check_course_completion(user_id, course_id) → BOOLEAN — if all done, mark complete, award 100 pts
6. generate_verification_code() → VARCHAR(20) — 'ELMS-XXXX-XXXX', unique
7. get_leaderboard(scope, scope_id, limit) → TABLE(rank, user_id, name, avatar, points, level)
8. get_admin_dashboard_stats() → JSONB
9. get_instructor_stats(instructor_id) → JSONB

Level thresholds: 0-99→Novice, 100-499→Explorer, 500-1499→Scholar, 1500-4999→Expert, 5000+→Master

Seed badges: First Steps, Quiz Whiz, Course Champion, Bundle Master, Social Learner, Streak Star, Top Scorer, Knowledge Seeker
```

---

## PHASE 2 — Authentication

### Prompt 2.1 — Backend Auth Module

```
Create backend/src/modules/auth/ (routes, controller, service, validators):

POST /api/auth/register { email, password, first_name, last_name }
  → supabase.auth.admin.createUser, update profile, return { user, token }

POST /api/auth/login { email, password }
  → supabase.auth.signInWithPassword, fetch profile, return { user, token, refresh_token }

POST /api/auth/refresh { refresh_token } → new tokens
POST /api/auth/logout → sign out
GET  /api/auth/me (protected) → current profile
PATCH /api/auth/profile (protected) → update own profile (not role)
POST /api/auth/forgot-password { email } → reset email

Rate limit: 5/min on login+register. Zod validation. Audit log all actions.
```

### Prompt 2.2 — Frontend Auth Pages

```
Build auth UI:

1. (auth)/layout.tsx — centered card, logo
2. (auth)/login/page.tsx — email+password form, react-hook-form+zod, POST /api/auth/login, store token in auth-store, redirect to /dashboard
3. (auth)/register/page.tsx — name+email+password form, POST /api/auth/register, redirect to /login
4. hooks/use-auth.ts — user, role, isAuthenticated, login(), logout(). On mount: verify token with GET /api/auth/me
5. middleware.ts — protect /dashboard/*, redirect auth users from /login

Tailwind styling: slate/zinc palette, blue-600 primary.
```

---

## PHASE 3 — Dashboard Layout

### Prompt 3.1 — Role-Based Shell

```
Build (dashboard)/layout.tsx:

Collapsible sidebar with role-specific nav:
  LEARNER: Dashboard, Browse Courses, My Learning, Certificates, Leaderboard
  INSTRUCTOR: Dashboard, My Courses, Question Bank, Grade Submissions, Analytics
  ADMIN: Dashboard, Users, All Courses, Bundles, Analytics, Audit Logs, Integrations

Header: breadcrumbs, notification bell (unread count from GET /api/notifications/unread-count), user avatar dropdown (profile, sign out).

(dashboard)/page.tsx: redirect to role-specific home.

Icons: lucide-react. Sidebar: dark slate-800, blue-500 active. Mobile: hamburger drawer. Zustand for collapsed state.
```

---

## PHASE 4 — Course Management

### Prompt 4.1 — Course CRUD Backend

```
Create backend/src/modules/courses/ (routes, controller, service, validators):

GET /api/courses ?page,limit,status,difficulty,search,sort — role-aware filtering, paginated
GET /api/courses/:slug — full course with modules, lessons, instructors
POST /api/courses (instructor/admin) — create with slug generation, add creator as lead instructor
PATCH /api/courses/:id — update
POST /api/courses/:id/publish — validate has content, set published
POST /api/courses/:id/archive (admin)
DELETE /api/courses/:id (admin) — soft delete
POST /api/courses/:id/instructors { instructor_id, role }
DELETE /api/courses/:id/instructors/:instructorId
```

### Prompt 4.2 — Module, Lesson, Upload Backend

```
Create backend/src/modules/content/:

POST/PATCH/DELETE /api/courses/:courseId/modules + reorder
POST/PATCH/DELETE /api/modules/:moduleId/lessons + reorder
POST /api/upload — multer, upload to Supabase Storage 'course-content' bucket, return URL. Max 500MB. Types: pdf,mp4,webm,pptx,docx,png,jpg,gif.

All restricted to course instructors + admins.
```

### Prompt 4.3 — Course Management Frontend

```
Build instructor course UI:

1. instructor/courses/page.tsx — course grid, status filter tabs, search, "Create New Course"
2. instructor/courses/new/page.tsx — creation form → POST /api/courses → redirect to edit
3. instructor/courses/[id]/edit/page.tsx — tabbed:
   Tab 1 Details: edit fields
   Tab 2 Content: ModuleTree (expandable modules/lessons, add/edit/delete/reorder, file upload)
   Tab 3 Instructors: search+add+remove co-instructors
   Tab 4 Settings: publish/archive, max enrollment

Components: CourseForm, ModuleTree, ModuleFormModal, LessonFormModal, InstructorManager
```

---

## PHASE 5 — Learner Experience

### Prompt 5.1 — Enrollment Backend

```
Create backend/src/modules/enrollments/:

POST /api/courses/:courseId/enroll — check published+capacity, insert enrollment
GET /api/enrollments/my ?status — current user's enrollments with course info
POST /api/lessons/:lessonId/complete — upsert progress, recalculate course progress, award 10pts, check completion
GET /api/courses/:courseId/progress — enrollment status, progress %, next lesson
```

### Prompt 5.2 — Learner Frontend

```
Build learner pages:

1. learner/courses/page.tsx — published course grid, search/filter/sort/paginate, enroll or continue
2. learner/courses/[slug]/page.tsx — detail hero, syllabus accordion, enroll CTA or progress+continue, tabs (syllabus, assessments, forum, announcements)
3. components/course/LessonViewer.tsx — sidebar module tree with checkmarks, main content area (video/pdf/text/embed), "Mark Complete" button, prev/next nav
4. learner/my-learning/page.tsx — enrolled courses with progress bars, filter/sort
5. learner/page.tsx — dashboard: stats cards, recent activity, upcoming deadlines, continue last course
```

---

## PHASE 6 — Assessment Engine

### Prompt 6.1 — Assessment Backend

```
Create backend/src/modules/assessments/:

Question bank: GET/POST/PATCH/DELETE /api/questions + bulk-delete + filters
Assessments: GET/POST/PATCH/DELETE /api/assessments + add/remove/reorder questions
Submissions: POST /api/assessments/:id/start — check attempts+dates, create submission, return questions (NO correct answers)
POST /api/submissions/:id/answer — save answer
POST /api/submissions/:id/submit — submit, auto-grade RPC, award 25pts if passed
GET /api/submissions/:id/results — after graded only
Grading: GET /api/assessments/:id/submissions?status=submitted
POST /api/submissions/:id/grade { answers: [{question_id, points_awarded, feedback}] } — update, notify learner
```

### Prompt 6.2 — Assessment Frontend

```
Build assessment UI:

INSTRUCTOR:
1. instructor/question-bank/page.tsx — table, filters, QuestionFormModal (type-specific answer fields)
2. Assessment builder (course edit Tab or separate): form + question picker from bank + publish
3. instructor/assessments/[id]/grade/page.tsx — pending submissions list, per-question grading

LEARNER:
4. learner/assessments/[id]/page.tsx — pre-start screen → quiz player:
   One question at a time, prev/next, timer countdown, type-specific inputs,
   auto-save answers, auto-submit on expiry, review page, submit, results page
```

---

## PHASE 7 — Gamification & Certificates

### Prompt 7.1 — Gamification

```
Create backend/src/modules/gamification/:

GET /api/leaderboard ?scope,scopeId,limit — calls RPC
GET /api/gamification/my-stats — points, level, streak, badges
GET /api/gamification/badges — all badges with earned status

Internal: awardPoints(), checkAndAwardBadges(), updateStreak()
Badge criteria checks after each relevant action.

Points: lesson=10, quiz=25, course=100, bundle=250, forum=5, streak=50

Frontend:
- learner/leaderboard/page.tsx — global/course/monthly tabs, ranked table, highlight self
- PointsBadge component in header
- AchievementToast on new badge (Realtime subscription)
```

### Prompt 7.2 — Certificates

```
Create backend/src/modules/certificates/:

POST /api/certificates/generate { userId, courseId } — verify completion, generate code, render HTML→PDF with Puppeteer, upload to Supabase Storage, insert record, notify user
GET /api/certificates/my — user's certificates
GET /api/certificates/verify/:code — public, no auth

Frontend:
- learner/certificates/page.tsx — grid, download PDF, copy verify URL
- verify/[code]/page.tsx — public verification display
```

---

## PHASE 8 — Communication

### Prompt 8.1 — Forums, Messages, Notifications Backend

```
Create backend/src/modules/communication/:

Forums: GET/POST threads, GET thread with posts, POST reply, pin/lock/delete
Messages: GET conversations, GET thread, POST send, PATCH read
Notifications: GET paginated, GET unread-count, PATCH read, POST mark-all-read
Announcements: GET/POST course announcements, POST system-wide (admin)
Internal: createNotification(), bulkCreateNotifications() for announcement→notify enrolled
```

### Prompt 8.2 — Communication Frontend

```
Build:
1. Course forum in course detail page — threads, replies, instructor moderation
2. /messages page — conversation list + chat view + compose + Realtime updates
3. NotificationBell dropdown — list, mark read, Realtime subscription for new
4. Announcements in course detail + instructor course edit
5. Course calendar component — monthly view with assessment deadlines
```

---

## PHASE 9 — Admin Panel & Analytics

### Prompt 9.1 — Admin Backend

```
Create backend/src/modules/admin/:

GET /api/admin/dashboard — stats RPC
GET /api/admin/users + PATCH role + PATCH status
CRUD /api/admin/bundles + manage courses in bundles
GET /api/admin/audit-logs + CSV export
GET/PATCH /api/admin/integrations
GET /api/instructor/analytics/:courseId — enrollment trend, scores, at-risk learners, question difficulty
```

### Prompt 9.2 — Admin Frontend

```
Build:
1. admin/page.tsx — stat cards + charts (recharts: user growth, enrollments, role distribution)
2. admin/users/page.tsx — data table, search, filter, role change, activate/deactivate
3. admin/bundles/page.tsx — CRUD bundles, drag-reorder courses
4. admin/audit-logs/page.tsx — table, filters, expandable details, CSV export
5. instructor/analytics/page.tsx — course selector, stats cards, charts, at-risk table
```

---

## PHASE 10 — Realtime

### Prompt 10.1 — Supabase Realtime Subscriptions

```
Create hooks/use-realtime.ts — generic useRealtimeTable<T>(table, filter, callbacks).

Apply to:
- NotificationBell: notifications INSERT → increment count + toast
- Messages: messages INSERT → append to conversation
- Leaderboard: profiles UPDATE → re-sort
- Forum: forum_posts INSERT → "New replies" indicator
- Grading: submissions UPDATE → "Assessment graded" toast
- Badges: user_badges INSERT → achievement popup with CSS confetti

Frontend connects to Supabase Realtime via anon key (RLS enforced). This is the ONLY direct frontend↔Supabase connection. All other data goes through Node.js backend.
```

---

## PHASE 11 — Public Pages

### Prompt 11.1 — Landing & Error Pages

```
Build:
1. app/page.tsx — landing: hero, feature cards (6), stats counters, footer
2. app/not-found.tsx — custom 404
3. app/error.tsx — global error boundary
Styling: professional, slate/zinc + green-500 accents, system fonts, fully responsive.
```

---

## PHASE 12 — Security & Deployment

### Prompt 12.1 — Security Hardening

```
Backend: rate limiting (5/min auth, 100/min other), input sanitization (DOMPurify for HTML content), helmet CSP, strict CORS, Zod on all endpoints, audit logging on all writes, env security check.
Frontend: token in Zustand+localStorage, auto-refresh, clear on logout, generic error messages.
```

### Prompt 12.2 — Docker & CI/CD

```
1. backend/Dockerfile — Node 20 Alpine, multi-stage, include puppeteer deps
2. frontend/Dockerfile — Node 20 Alpine, Next.js standalone build
3. docker-compose.yml — frontend:3000 + backend:4000 (Supabase is cloud)
4. .github/workflows/ci.yml — lint, test, build, deploy stages
5. README.md — setup instructions, env vars, docker commands
```

---

## Quick Reference

### Point Values
| Event | Points |
|-------|--------|
| Complete lesson | 10 |
| Pass quiz/exam | 25 |
| Complete course | 100 |
| Complete bundle | 250 |
| Forum post | 5 |
| 7-day streak | 50 |

### Levels
| Points | Level |
|--------|-------|
| 0–99 | Novice |
| 100–499 | Explorer |
| 500–1,499 | Scholar |
| 1,500–4,999 | Expert |
| 5,000+ | Master |

### Backend Module Pattern
```
modules/{name}/
├── {name}.routes.ts
├── {name}.controller.ts
├── {name}.service.ts
└── {name}.validators.ts
```

### Build Timeline
| Phase | Focus | Days |
|-------|-------|------|
| 0 | Monorepo + boilerplate | 2 |
| 1 | Database schema + RLS + functions | 2 |
| 2 | Authentication | 2 |
| 3 | Dashboard layout | 1 |
| 4 | Course management | 4 |
| 5 | Learner experience | 3 |
| 6 | Assessment engine | 5 |
| 7 | Gamification + certificates | 3 |
| 8 | Communication | 3 |
| 9 | Admin + analytics | 3 |
| 10 | Realtime | 2 |
| 11 | Public pages | 1 |
| 12 | Security + deployment | 2 |
| **Total** | | **~33 days** |

---

*ELMS Development Plan v1.0 — Next.js + Node.js/Express + Supabase — 40 prompts · 12 phases*
