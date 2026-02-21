-- ============================================================
-- ELMS — 001_tables.sql
-- All 25 tables in FK dependency order
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'learner'
              CHECK (role IN ('learner', 'instructor', 'admin', 'super_admin')),
  avatar_url  TEXT,
  bio         TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  points      INTEGER NOT NULL DEFAULT 0,
  level       TEXT NOT NULL DEFAULT 'Novice'
              CHECK (level IN ('Novice', 'Explorer', 'Scholar', 'Expert', 'Master')),
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_points ON profiles(points DESC);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. COURSES
-- ============================================================

CREATE TABLE courses (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  description             TEXT,
  thumbnail_url           TEXT,
  status                  TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'archived')),
  difficulty              TEXT NOT NULL DEFAULT 'beginner'
                          CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours         NUMERIC,
  is_certification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  passing_score           NUMERIC NOT NULL DEFAULT 70,
  max_enrollments         INTEGER,
  created_by              UUID NOT NULL REFERENCES profiles(id),
  published_at            TIMESTAMPTZ,
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. COURSE_INSTRUCTORS
-- ============================================================

CREATE TABLE course_instructors (
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'assistant'
                CHECK (role IN ('lead', 'assistant', 'grader')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, instructor_id)
);

CREATE INDEX idx_course_instructors_instructor ON course_instructors(instructor_id);

-- ============================================================
-- 4. COURSE_BUNDLES
-- ============================================================

CREATE TABLE course_bundles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  is_sequential BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES profiles(id),
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_bundles_created_by ON course_bundles(created_by);

CREATE TRIGGER trg_course_bundles_updated_at
  BEFORE UPDATE ON course_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. BUNDLE_COURSES
-- ============================================================

CREATE TABLE bundle_courses (
  bundle_id  UUID NOT NULL REFERENCES course_bundles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, course_id)
);

CREATE INDEX idx_bundle_courses_course ON bundle_courses(course_id);

-- ============================================================
-- 6. MODULES
-- ============================================================

CREATE TABLE modules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules(course_id);

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. LESSONS
-- ============================================================

CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  content_type     TEXT NOT NULL DEFAULT 'text'
                   CHECK (content_type IN ('video', 'pdf', 'text', 'embed', 'slides')),
  content_url      TEXT,
  content_body     TEXT,
  duration_minutes INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_module ON lessons(module_id);

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. ENROLLMENTS
-- ============================================================

CREATE TABLE enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'completed', 'dropped')),
  progress     NUMERIC NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. LESSON_PROGRESS
-- ============================================================

CREATE TABLE lesson_progress (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id          UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at       TIMESTAMPTZ,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. QUESTION_BANK
-- ============================================================

CREATE TABLE question_bank (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category       TEXT,
  question_type  TEXT NOT NULL
                 CHECK (question_type IN ('mcq', 'true_false', 'fill_blank', 'short_answer', 'essay')),
  question_text  TEXT NOT NULL,
  options        JSONB,
  correct_answer TEXT NOT NULL,
  points         INTEGER NOT NULL DEFAULT 1,
  difficulty     TEXT NOT NULL DEFAULT 'beginner'
                 CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  explanation    TEXT,
  created_by     UUID NOT NULL REFERENCES profiles(id),
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_bank_course ON question_bank(course_id);
CREATE INDEX idx_question_bank_course_category ON question_bank(course_id, category);
CREATE INDEX idx_question_bank_type ON question_bank(question_type);

CREATE TRIGGER trg_question_bank_updated_at
  BEFORE UPDATE ON question_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. ASSESSMENTS
-- ============================================================

CREATE TABLE assessments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id          UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id          UUID REFERENCES modules(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  type               TEXT NOT NULL DEFAULT 'quiz'
                     CHECK (type IN ('quiz', 'mid_term', 'final', 'assignment')),
  description        TEXT,
  time_limit_minutes INTEGER,
  max_attempts       INTEGER NOT NULL DEFAULT 1,
  shuffle_questions  BOOLEAN NOT NULL DEFAULT FALSE,
  passing_score      NUMERIC NOT NULL DEFAULT 70,
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  available_from     TIMESTAMPTZ,
  available_until    TIMESTAMPTZ,
  created_by         UUID NOT NULL REFERENCES profiles(id),
  is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_assessments_module ON assessments(module_id);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);

CREATE TRIGGER trg_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. ASSESSMENT_QUESTIONS (junction)
-- ============================================================

CREATE TABLE assessment_questions (
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (assessment_id, question_id)
);

CREATE INDEX idx_assessment_questions_question ON assessment_questions(question_id);

-- ============================================================
-- 13. SUBMISSIONS
-- ============================================================

CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress', 'submitted', 'graded')),
  score           NUMERIC,
  total_points    NUMERIC,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  graded_at       TIMESTAMPTZ,
  graded_by       UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_user_assessment ON submissions(user_id, assessment_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. SUBMISSION_ANSWERS
-- ============================================================

CREATE TABLE submission_answers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id    UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  answer_text      TEXT,
  selected_options JSONB,
  is_correct       BOOLEAN,
  points_awarded   NUMERIC,
  feedback         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submission_answers_submission ON submission_answers(submission_id);
CREATE INDEX idx_submission_answers_question ON submission_answers(question_id);

-- ============================================================
-- 15. CERTIFICATES
-- ============================================================

CREATE TABLE certificates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL UNIQUE,
  certificate_url   TEXT,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_code ON certificates(verification_code);

-- ============================================================
-- 16. BADGES
-- ============================================================

CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url    TEXT,
  criteria    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 17. USER_BADGES
-- ============================================================

CREATE TABLE user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ============================================================
-- 18. POINTS_LEDGER
-- ============================================================

CREATE TABLE points_ledger (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points       INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_user ON points_ledger(user_id);

-- ============================================================
-- 19. FORUM_THREADS
-- ============================================================

CREATE TABLE forum_threads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked  BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_threads_course ON forum_threads(course_id);
CREATE INDEX idx_forum_threads_created_by ON forum_threads(created_by);

CREATE TRIGGER trg_forum_threads_updated_at
  BEFORE UPDATE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 20. FORUM_POSTS
-- ============================================================

CREATE TABLE forum_posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id  UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX idx_forum_posts_parent ON forum_posts(parent_id);
CREATE INDEX idx_forum_posts_created_by ON forum_posts(created_by);

CREATE TRIGGER trg_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 21. MESSAGES
-- ============================================================

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- ============================================================
-- 22. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN ('enrollment', 'assessment', 'grade', 'certificate',
                                'badge', 'announcement', 'forum', 'message', 'system')),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  reference_url TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================================
-- 23. ANNOUNCEMENTS
-- ============================================================

CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_course ON announcements(course_id);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 24. AUDIT_LOGS (append-only — NO updated_at, NO soft delete)
-- ============================================================

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id UUID,
  changes     JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- ============================================================
-- 25. INTEGRATION_CONFIGS
-- ============================================================

CREATE TABLE integration_configs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider   TEXT NOT NULL,
  config     JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_configs_provider ON integration_configs(provider);

CREATE TRIGGER trg_integration_configs_updated_at
  BEFORE UPDATE ON integration_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
