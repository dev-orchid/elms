-- ============================================================
-- 006_fix_mcq_grading.sql
-- Fix: MCQ auto-grading comparison was failing because
-- selected_options is JSONB (e.g. '"a"') while correct_answer
-- is TEXT (e.g. 'a'). Strip JSONB quotes before comparing.
-- Run in Supabase SQL Editor.
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
  v_selected TEXT;
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
        -- selected_options is JSONB; extract as plain text for comparison
        -- handles both JSONB string ('"a"') and JSONB value
        v_selected := TRIM(BOTH '"' FROM (v_answer.selected_options)::TEXT);
        v_is_correct := (v_selected = v_question.correct_answer);
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
