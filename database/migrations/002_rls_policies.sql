-- ============================================================
-- ELMS — 002_rls_policies.sql
-- Row-Level Security policies for all tables
-- Run in Supabase SQL Editor AFTER 001_tables.sql
-- ============================================================

-- ============================================================
-- HELPER: get_user_role()
-- Returns the role of the currently authenticated user
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. PROFILES
-- All authenticated users can read profiles.
-- Users can update their own profile (except role).
-- Admins can update anyone.
-- ============================================================

CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- ============================================================
-- 2. COURSES
-- Published courses visible to all authenticated users.
-- Draft/archived visible to instructors of that course and admins.
-- Write: instructors + admins.
-- ============================================================

CREATE POLICY courses_select_published ON courses
  FOR SELECT TO authenticated
  USING (
    status = 'published' AND is_deleted = false
  );

CREATE POLICY courses_select_instructor ON courses
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM course_instructors
        WHERE course_id = courses.id AND instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY courses_select_admin ON courses
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY courses_insert ON courses
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('instructor', 'admin', 'super_admin')
  );

CREATE POLICY courses_update ON courses
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = courses.id AND instructor_id = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY courses_delete ON courses
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 3. COURSE_INSTRUCTORS
-- Readable by anyone authenticated.
-- Write: course owner, admins.
-- ============================================================

CREATE POLICY course_instructors_select ON course_instructors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY course_instructors_insert ON course_instructors
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY course_instructors_delete ON course_instructors
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 4. COURSE_BUNDLES
-- All authenticated can read.
-- Admin write.
-- ============================================================

CREATE POLICY course_bundles_select ON course_bundles
  FOR SELECT TO authenticated
  USING (is_deleted = false);

CREATE POLICY course_bundles_select_admin ON course_bundles
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY course_bundles_insert ON course_bundles
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY course_bundles_update ON course_bundles
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY course_bundles_delete ON course_bundles
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- ============================================================
-- 5. BUNDLE_COURSES
-- All authenticated can read.
-- Admin write.
-- ============================================================

CREATE POLICY bundle_courses_select ON bundle_courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY bundle_courses_insert ON bundle_courses
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY bundle_courses_delete ON bundle_courses
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- ============================================================
-- 6. MODULES
-- Visible if enrolled in published course, or instructor/admin.
-- Write: instructors + admins.
-- ============================================================

CREATE POLICY modules_select_enrolled ON modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN enrollments e ON e.course_id = c.id
      WHERE c.id = modules.course_id
        AND c.status = 'published'
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY modules_select_instructor ON modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = modules.course_id AND instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = modules.course_id AND created_by = auth.uid()
    )
  );

CREATE POLICY modules_select_admin ON modules
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY modules_insert ON modules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = modules.course_id AND instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = modules.course_id AND created_by = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY modules_update ON modules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = modules.course_id AND instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = modules.course_id AND created_by = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY modules_delete ON modules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = modules.course_id AND instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = modules.course_id AND created_by = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 7. LESSONS
-- Same visibility rules as modules (via module → course).
-- Write: instructors + admins.
-- ============================================================

CREATE POLICY lessons_select_enrolled ON lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      JOIN enrollments e ON e.course_id = c.id
      WHERE m.id = lessons.module_id
        AND c.status = 'published'
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY lessons_select_instructor ON lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      WHERE m.id = lessons.module_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = m.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = m.course_id AND created_by = auth.uid())
        )
    )
  );

CREATE POLICY lessons_select_admin ON lessons
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY lessons_insert ON lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules m
      WHERE m.id = lessons.module_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = m.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = m.course_id AND created_by = auth.uid())
        )
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY lessons_update ON lessons
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      WHERE m.id = lessons.module_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = m.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = m.course_id AND created_by = auth.uid())
        )
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY lessons_delete ON lessons
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      WHERE m.id = lessons.module_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = m.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = m.course_id AND created_by = auth.uid())
        )
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 8. ENROLLMENTS
-- Own read. Instructors read their courses. Admin all.
-- Learners self-enroll. Own progress update.
-- ============================================================

CREATE POLICY enrollments_select_own ON enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY enrollments_select_instructor ON enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = enrollments.course_id AND instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = enrollments.course_id AND created_by = auth.uid()
    )
  );

CREATE POLICY enrollments_select_admin ON enrollments
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY enrollments_insert_own ON enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY enrollments_update_own ON enrollments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 9. LESSON_PROGRESS
-- Own read/write only.
-- ============================================================

CREATE POLICY lesson_progress_select_own ON lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY lesson_progress_insert_own ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY lesson_progress_update_own ON lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 10. QUESTION_BANK
-- NEVER visible to learners.
-- Instructors see their courses' questions. Admins see all.
-- ============================================================

CREATE POLICY question_bank_select_instructor ON question_bank
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      EXISTS (
        SELECT 1 FROM course_instructors
        WHERE course_id = question_bank.course_id AND instructor_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM courses WHERE id = question_bank.course_id AND created_by = auth.uid()
      )
    )
  );

CREATE POLICY question_bank_select_admin ON question_bank
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY question_bank_insert ON question_bank
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('instructor', 'admin', 'super_admin')
  );

CREATE POLICY question_bank_update ON question_bank
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = question_bank.course_id AND instructor_id = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY question_bank_delete ON question_bank
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 11. ASSESSMENTS
-- Published assessments visible to enrolled learners.
-- Write: instructors + admins.
-- ============================================================

CREATE POLICY assessments_select_enrolled ON assessments
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND is_deleted = false
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE course_id = assessments.course_id AND user_id = auth.uid()
    )
  );

CREATE POLICY assessments_select_instructor ON assessments
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      EXISTS (
        SELECT 1 FROM course_instructors
        WHERE course_id = assessments.course_id AND instructor_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM courses WHERE id = assessments.course_id AND created_by = auth.uid()
      )
    )
  );

CREATE POLICY assessments_select_admin ON assessments
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY assessments_insert ON assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('instructor', 'admin', 'super_admin')
  );

CREATE POLICY assessments_update ON assessments
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM course_instructors
      WHERE course_id = assessments.course_id AND instructor_id = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY assessments_delete ON assessments
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 12. ASSESSMENT_QUESTIONS
-- Same as assessments visibility.
-- ============================================================

CREATE POLICY assessment_questions_select_enrolled ON assessment_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_questions.assessment_id
        AND a.is_published = true
        AND EXISTS (
          SELECT 1 FROM enrollments WHERE course_id = a.course_id AND user_id = auth.uid()
        )
    )
  );

CREATE POLICY assessment_questions_select_instructor ON assessment_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_questions.assessment_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = a.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = a.course_id AND created_by = auth.uid())
        )
    )
  );

CREATE POLICY assessment_questions_select_admin ON assessment_questions
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY assessment_questions_insert ON assessment_questions
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('instructor', 'admin', 'super_admin'));

CREATE POLICY assessment_questions_delete ON assessment_questions
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('instructor', 'admin', 'super_admin'));

-- ============================================================
-- 13. SUBMISSIONS
-- Own read. Instructors for their courses. Own insert. Instructor update (grading).
-- ============================================================

CREATE POLICY submissions_select_own ON submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY submissions_select_instructor ON submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN course_instructors ci ON ci.course_id = a.course_id
      WHERE a.id = submissions.assessment_id
        AND ci.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM assessments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assessment_id
        AND c.created_by = auth.uid()
    )
  );

CREATE POLICY submissions_select_admin ON submissions
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY submissions_insert_own ON submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY submissions_update_own ON submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'in_progress');

CREATE POLICY submissions_update_instructor ON submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN course_instructors ci ON ci.course_id = a.course_id
      WHERE a.id = submissions.assessment_id
        AND ci.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM assessments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assessment_id
        AND c.created_by = auth.uid()
    )
  );

-- ============================================================
-- 14. SUBMISSION_ANSWERS
-- Own read. Instructors for grading. Own insert.
-- ============================================================

CREATE POLICY submission_answers_select_own ON submission_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions WHERE id = submission_answers.submission_id AND user_id = auth.uid()
    )
  );

CREATE POLICY submission_answers_select_instructor ON submission_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN course_instructors ci ON ci.course_id = a.course_id
      WHERE s.id = submission_answers.submission_id
        AND ci.instructor_id = auth.uid()
    )
  );

CREATE POLICY submission_answers_select_admin ON submission_answers
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY submission_answers_insert_own ON submission_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE id = submission_answers.submission_id
        AND user_id = auth.uid()
        AND status = 'in_progress'
    )
  );

CREATE POLICY submission_answers_update_instructor ON submission_answers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN course_instructors ci ON ci.course_id = a.course_id
      WHERE s.id = submission_answers.submission_id
        AND ci.instructor_id = auth.uid()
    )
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 15. CERTIFICATES
-- Read all (public verification). Insert: service role only.
-- ============================================================

CREATE POLICY certificates_select ON certificates
  FOR SELECT TO authenticated
  USING (true);

-- Anon select for public verification
CREATE POLICY certificates_select_anon ON certificates
  FOR SELECT TO anon
  USING (true);

-- No insert/update/delete policies for authenticated users —
-- certificates are created via service_role only.

-- ============================================================
-- 16. BADGES
-- Read all.
-- ============================================================

CREATE POLICY badges_select ON badges
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 17. USER_BADGES
-- Read all (public display).
-- ============================================================

CREATE POLICY user_badges_select ON user_badges
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 18. POINTS_LEDGER
-- Read all (for leaderboard).
-- ============================================================

CREATE POLICY points_ledger_select ON points_ledger
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 19. FORUM_THREADS
-- Enrolled + instructors + admins read.
-- Enrolled + instructors can create.
-- Own edit + instructor moderate.
-- ============================================================

CREATE POLICY forum_threads_select ON forum_threads
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND (
      EXISTS (SELECT 1 FROM enrollments WHERE course_id = forum_threads.course_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = forum_threads.course_id AND instructor_id = auth.uid())
      OR EXISTS (SELECT 1 FROM courses WHERE id = forum_threads.course_id AND created_by = auth.uid())
      OR get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY forum_threads_insert ON forum_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = forum_threads.course_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = forum_threads.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses WHERE id = forum_threads.course_id AND created_by = auth.uid())
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY forum_threads_update_own ON forum_threads
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY forum_threads_update_instructor ON forum_threads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM course_instructors WHERE course_id = forum_threads.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses WHERE id = forum_threads.course_id AND created_by = auth.uid())
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY forum_threads_delete ON forum_threads
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = forum_threads.course_id AND instructor_id = auth.uid())
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 20. FORUM_POSTS
-- Same course-scoped visibility as threads.
-- ============================================================

CREATE POLICY forum_posts_select ON forum_posts
  FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1 FROM forum_threads ft
      WHERE ft.id = forum_posts.thread_id
        AND ft.is_deleted = false
        AND (
          EXISTS (SELECT 1 FROM enrollments WHERE course_id = ft.course_id AND user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = ft.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = ft.course_id AND created_by = auth.uid())
          OR get_user_role() IN ('admin', 'super_admin')
        )
    )
  );

CREATE POLICY forum_posts_insert ON forum_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_threads ft
      WHERE ft.id = forum_posts.thread_id
        AND ft.is_locked = false
        AND (
          EXISTS (SELECT 1 FROM enrollments WHERE course_id = ft.course_id AND user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = ft.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = ft.course_id AND created_by = auth.uid())
          OR get_user_role() IN ('admin', 'super_admin')
        )
    )
  );

CREATE POLICY forum_posts_update_own ON forum_posts
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY forum_posts_update_instructor ON forum_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forum_threads ft
      WHERE ft.id = forum_posts.thread_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = ft.course_id AND instructor_id = auth.uid())
          OR EXISTS (SELECT 1 FROM courses WHERE id = ft.course_id AND created_by = auth.uid())
          OR get_user_role() IN ('admin', 'super_admin')
        )
    )
  );

CREATE POLICY forum_posts_delete ON forum_posts
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM forum_threads ft
      WHERE ft.id = forum_posts.thread_id
        AND (
          EXISTS (SELECT 1 FROM course_instructors WHERE course_id = ft.course_id AND instructor_id = auth.uid())
          OR get_user_role() IN ('admin', 'super_admin')
        )
    )
  );

-- ============================================================
-- 21. MESSAGES
-- Own only (sender or receiver).
-- ============================================================

CREATE POLICY messages_select_own ON messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY messages_insert_own ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY messages_update_receiver ON messages
  FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

-- ============================================================
-- 22. NOTIFICATIONS
-- Own only.
-- ============================================================

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- No insert for authenticated — service_role creates notifications.

-- ============================================================
-- 23. ANNOUNCEMENTS
-- Course announcements visible to enrolled + instructors + admins.
-- System-wide (null course_id) visible to all.
-- ============================================================

CREATE POLICY announcements_select ON announcements
  FOR SELECT TO authenticated
  USING (
    course_id IS NULL
    OR EXISTS (SELECT 1 FROM enrollments WHERE course_id = announcements.course_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM course_instructors WHERE course_id = announcements.course_id AND instructor_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses WHERE id = announcements.course_id AND created_by = auth.uid())
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY announcements_insert ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('instructor', 'admin', 'super_admin')
  );

CREATE POLICY announcements_update ON announcements
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY announcements_delete ON announcements
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- 24. AUDIT_LOGS
-- Admin read only. Service role insert only.
-- ============================================================

CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- No insert/update/delete for authenticated — service_role only.

-- ============================================================
-- 25. INTEGRATION_CONFIGS
-- Admin only.
-- ============================================================

CREATE POLICY integration_configs_select ON integration_configs
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY integration_configs_insert ON integration_configs
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY integration_configs_update ON integration_configs
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY integration_configs_delete ON integration_configs
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));
