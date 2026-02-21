-- ============================================================
-- ELMS — 003_functions.sql
-- PostgreSQL functions, triggers, and seed data
-- Run in Supabase SQL Editor AFTER 001 and 002
-- ============================================================

-- ============================================================
-- 1. handle_new_user() — auto-create profile on auth.users INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. calculate_course_progress(p_user_id, p_course_id) → NUMERIC
-- Calculates completed/total lessons and updates enrollment
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_progress NUMERIC;
BEGIN
  -- Count total published lessons in the course
  SELECT COUNT(*) INTO v_total
  FROM lessons l
  JOIN modules m ON m.id = l.module_id
  WHERE m.course_id = p_course_id
    AND l.is_published = true
    AND m.is_published = true;

  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  -- Count completed lessons by user
  SELECT COUNT(*) INTO v_completed
  FROM lesson_progress lp
  JOIN lessons l ON l.id = lp.lesson_id
  JOIN modules m ON m.id = l.module_id
  WHERE lp.user_id = p_user_id
    AND m.course_id = p_course_id
    AND lp.is_completed = true
    AND l.is_published = true
    AND m.is_published = true;

  v_progress := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100, 2);

  -- Update enrollment progress
  UPDATE enrollments
  SET progress = v_progress
  WHERE user_id = p_user_id
    AND course_id = p_course_id;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. auto_grade_submission(p_submission_id) → JSONB
-- Auto-grades MCQ, true_false, fill_blank questions
-- Returns { score, total_points, status }
-- ============================================================

CREATE OR REPLACE FUNCTION auto_grade_submission(p_submission_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_answer RECORD;
  v_question RECORD;
  v_score NUMERIC := 0;
  v_total NUMERIC := 0;
  v_is_correct BOOLEAN;
  v_all_auto_gradeable BOOLEAN := true;
  v_status TEXT;
BEGIN
  FOR v_answer IN
    SELECT sa.id, sa.question_id, sa.answer_text, sa.selected_options
    FROM submission_answers sa
    WHERE sa.submission_id = p_submission_id
  LOOP
    SELECT qb.question_type, qb.correct_answer, qb.options, qb.points
    INTO v_question
    FROM question_bank qb
    WHERE qb.id = v_answer.question_id;

    v_total := v_total + v_question.points;

    -- Auto-grade based on question type
    IF v_question.question_type IN ('mcq', 'true_false', 'fill_blank') THEN
      IF v_question.question_type = 'mcq' THEN
        v_is_correct := (v_answer.selected_options::TEXT = v_question.correct_answer);
      ELSIF v_question.question_type = 'true_false' THEN
        v_is_correct := (LOWER(TRIM(v_answer.answer_text)) = LOWER(TRIM(v_question.correct_answer)));
      ELSIF v_question.question_type = 'fill_blank' THEN
        v_is_correct := (LOWER(TRIM(v_answer.answer_text)) = LOWER(TRIM(v_question.correct_answer)));
      END IF;

      UPDATE submission_answers
      SET is_correct = v_is_correct,
          points_awarded = CASE WHEN v_is_correct THEN v_question.points ELSE 0 END
      WHERE id = v_answer.id;

      IF v_is_correct THEN
        v_score := v_score + v_question.points;
      END IF;
    ELSE
      -- short_answer and essay need manual grading
      v_all_auto_gradeable := false;
    END IF;
  END LOOP;

  -- Determine status
  IF v_all_auto_gradeable THEN
    v_status := 'graded';
  ELSE
    v_status := 'submitted';
  END IF;

  -- Update submission
  UPDATE submissions
  SET score = v_score,
      total_points = v_total,
      status = v_status,
      submitted_at = NOW(),
      graded_at = CASE WHEN v_all_auto_gradeable THEN NOW() ELSE NULL END
  WHERE id = p_submission_id;

  RETURN jsonb_build_object(
    'score', v_score,
    'total_points', v_total,
    'status', v_status,
    'percentage', CASE WHEN v_total > 0 THEN ROUND((v_score / v_total) * 100, 2) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. award_points(p_user_id, p_points, p_reason, p_ref_id) → void
-- Inserts ledger entry, updates profile total + recalculates level
-- ============================================================

CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_ref_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level TEXT;
BEGIN
  -- Insert into points ledger
  INSERT INTO points_ledger (user_id, points, reason, reference_id)
  VALUES (p_user_id, p_points, p_reason, p_ref_id);

  -- Update profile points total
  UPDATE profiles
  SET points = points + p_points
  WHERE id = p_user_id
  RETURNING points INTO v_new_total;

  -- Calculate new level based on thresholds
  v_new_level := CASE
    WHEN v_new_total >= 5000 THEN 'Master'
    WHEN v_new_total >= 1500 THEN 'Expert'
    WHEN v_new_total >= 500  THEN 'Scholar'
    WHEN v_new_total >= 100  THEN 'Explorer'
    ELSE 'Novice'
  END;

  -- Update level if changed
  UPDATE profiles
  SET level = v_new_level
  WHERE id = p_user_id AND level != v_new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. check_course_completion(p_user_id, p_course_id) → BOOLEAN
-- If all lessons done: mark complete, award 100 points
-- ============================================================

CREATE OR REPLACE FUNCTION check_course_completion(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_progress NUMERIC;
  v_already_completed BOOLEAN;
BEGIN
  -- Check if already completed
  SELECT (status = 'completed') INTO v_already_completed
  FROM enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF v_already_completed THEN
    RETURN true;
  END IF;

  -- Calculate current progress
  v_progress := calculate_course_progress(p_user_id, p_course_id);

  IF v_progress >= 100 THEN
    -- Mark enrollment as completed
    UPDATE enrollments
    SET status = 'completed',
        progress = 100,
        completed_at = NOW()
    WHERE user_id = p_user_id
      AND course_id = p_course_id;

    -- Award course completion points
    PERFORM award_points(p_user_id, 100, 'Course completed', p_course_id);

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. generate_verification_code() → VARCHAR(20)
-- Generates unique certificate code: ELMS-XXXX-XXXX
-- ============================================================

CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'ELMS-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

    SELECT EXISTS(
      SELECT 1 FROM certificates WHERE verification_code = v_code
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. get_leaderboard(p_scope, p_scope_id, p_limit) → TABLE
-- scope: 'global', 'course', 'monthly'
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_scope TEXT DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  points INTEGER,
  level TEXT
) AS $$
BEGIN
  IF p_scope = 'course' AND p_scope_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.points DESC) AS rank,
      p.id AS user_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.avatar_url,
      p.points,
      p.level
    FROM profiles p
    JOIN enrollments e ON e.user_id = p.id
    WHERE e.course_id = p_scope_id
      AND p.is_active = true
    ORDER BY p.points DESC
    LIMIT p_limit;

  ELSIF p_scope = 'monthly' THEN
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pl.points), 0) DESC) AS rank,
      p.id AS user_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.avatar_url,
      COALESCE(SUM(pl.points), 0)::INTEGER AS points,
      p.level
    FROM profiles p
    LEFT JOIN points_ledger pl ON pl.user_id = p.id
      AND pl.created_at >= DATE_TRUNC('month', NOW())
    WHERE p.is_active = true
    GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.level
    HAVING COALESCE(SUM(pl.points), 0) > 0
    ORDER BY points DESC
    LIMIT p_limit;

  ELSE
    -- Global leaderboard
    RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY p.points DESC) AS rank,
      p.id AS user_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.avatar_url,
      p.points,
      p.level
    FROM profiles p
    WHERE p.is_active = true
      AND p.points > 0
    ORDER BY p.points DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. get_admin_dashboard_stats() → JSONB
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    'total_courses', (SELECT COUNT(*) FROM courses WHERE is_deleted = false),
    'total_enrollments', (SELECT COUNT(*) FROM enrollments),
    'active_users', (
      SELECT COUNT(*) FROM profiles
      WHERE is_active = true
        AND last_active_at >= NOW() - INTERVAL '7 days'
    ),
    'users_by_role', (
      SELECT jsonb_object_agg(role, cnt)
      FROM (
        SELECT role, COUNT(*) AS cnt
        FROM profiles
        WHERE is_active = true
        GROUP BY role
      ) r
    ),
    'enrollments_trend', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'count', c)), '[]'::jsonb)
      FROM (
        SELECT DATE(created_at) AS d, COUNT(*) AS c
        FROM enrollments
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY d
      ) t
    ),
    'popular_courses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'course_id', c.id, 'title', c.title, 'enrollments', e.cnt
      )), '[]'::jsonb)
      FROM (
        SELECT course_id, COUNT(*) AS cnt
        FROM enrollments
        GROUP BY course_id
        ORDER BY cnt DESC
        LIMIT 10
      ) e
      JOIN courses c ON c.id = e.course_id
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. get_instructor_stats(p_instructor_id) → JSONB
-- ============================================================

CREATE OR REPLACE FUNCTION get_instructor_stats(p_instructor_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_courses', (
      SELECT COUNT(DISTINCT c.id)
      FROM courses c
      LEFT JOIN course_instructors ci ON ci.course_id = c.id
      WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
        AND c.is_deleted = false
    ),
    'total_students', (
      SELECT COUNT(DISTINCT e.user_id)
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN course_instructors ci ON ci.course_id = c.id
      WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
    ),
    'pending_grading', (
      SELECT COUNT(*)
      FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN courses c ON c.id = a.course_id
      LEFT JOIN course_instructors ci ON ci.course_id = c.id
      WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
        AND s.status = 'submitted'
    ),
    'average_score', (
      SELECT COALESCE(ROUND(AVG(
        CASE WHEN s.total_points > 0
          THEN (s.score / s.total_points) * 100
          ELSE 0
        END
      ), 2), 0)
      FROM submissions s
      JOIN assessments a ON a.id = s.assessment_id
      JOIN courses c ON c.id = a.course_id
      LEFT JOIN course_instructors ci ON ci.course_id = c.id
      WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
        AND s.status = 'graded'
    ),
    'enrollment_trend', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'count', cnt)), '[]'::jsonb)
      FROM (
        SELECT DATE(e.created_at) AS d, COUNT(*) AS cnt
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN course_instructors ci ON ci.course_id = c.id
        WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
          AND e.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(e.created_at)
        ORDER BY d
      ) t
    ),
    'course_stats', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'course_id', cs.id,
        'title', cs.title,
        'students', cs.students,
        'avg_progress', cs.avg_progress
      )), '[]'::jsonb)
      FROM (
        SELECT c.id, c.title,
          COUNT(e.id) AS students,
          COALESCE(ROUND(AVG(e.progress), 2), 0) AS avg_progress
        FROM courses c
        LEFT JOIN course_instructors ci ON ci.course_id = c.id
        LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE (c.created_by = p_instructor_id OR ci.instructor_id = p_instructor_id)
          AND c.is_deleted = false
        GROUP BY c.id, c.title
        ORDER BY students DESC
      ) cs
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED BADGES
-- ============================================================

INSERT INTO badges (name, description, icon_url, criteria) VALUES
  ('First Steps', 'Complete your first lesson', NULL, '{"type": "lesson_complete", "count": 1}'::jsonb),
  ('Quiz Whiz', 'Pass your first quiz', NULL, '{"type": "quiz_pass", "count": 1}'::jsonb),
  ('Course Champion', 'Complete your first course', NULL, '{"type": "course_complete", "count": 1}'::jsonb),
  ('Bundle Master', 'Complete an entire course bundle', NULL, '{"type": "bundle_complete", "count": 1}'::jsonb),
  ('Social Learner', 'Create 10 forum posts', NULL, '{"type": "forum_posts", "count": 10}'::jsonb),
  ('Streak Star', 'Maintain a 7-day learning streak', NULL, '{"type": "streak", "days": 7}'::jsonb),
  ('Top Scorer', 'Score 100% on any assessment', NULL, '{"type": "perfect_score", "count": 1}'::jsonb),
  ('Knowledge Seeker', 'Enroll in 5 courses', NULL, '{"type": "enrollments", "count": 5}'::jsonb)
ON CONFLICT (name) DO NOTHING;
