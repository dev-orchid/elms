import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors.js';
import { parsePagination, paginationResult } from '../../utils/pagination.js';
import { coursesService } from '../courses/courses.service.js';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionQuery,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  SaveAnswerInput,
  GradeSubmissionInput,
} from './assessments.validators.js';

export class AssessmentsService {
  // ─── Question Bank ──────────────────────────────────────

  async listQuestions(query: QuestionQuery, userId: string, userRole: string) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('question_bank')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false);

    if (query.course_id) {
      qb = qb.eq('course_id', query.course_id);
    }
    if (query.category) {
      qb = qb.eq('category', query.category);
    }
    if (query.question_type) {
      qb = qb.eq('question_type', query.question_type);
    }
    if (query.difficulty) {
      qb = qb.eq('difficulty', query.difficulty);
    }
    if (query.search) {
      qb = qb.ilike('question_text', `%${query.search}%`);
    }

    // Instructors only see their course questions
    if (userRole === 'instructor') {
      const { data: instructedIds } = await supabase
        .from('course_instructors')
        .select('course_id')
        .eq('instructor_id', userId);
      const courseIds = instructedIds?.map((r) => r.course_id) || [];
      if (courseIds.length > 0) {
        qb = qb.in('course_id', courseIds);
      } else {
        return { questions: [], pagination: paginationResult({ page, limit }, 0) };
      }
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: questions, error, count } = await qb;

    if (error) throw new AppError('Failed to fetch questions', 500);

    return {
      questions: questions || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async createQuestion(input: CreateQuestionInput, userId: string, userRole: string) {
    await coursesService.assertCourseAccess(input.course_id, userId, userRole);

    const { data: question, error } = await supabase
      .from('question_bank')
      .insert({ ...input, created_by: userId })
      .select('*')
      .single();

    if (error) throw new AppError('Failed to create question: ' + error.message, 400);
    return question;
  }

  async updateQuestion(questionId: string, input: UpdateQuestionInput, userId: string, userRole: string) {
    const q = await this.getQuestionOrThrow(questionId);
    await coursesService.assertCourseAccess(q.course_id, userId, userRole);

    const { data: question, error } = await supabase
      .from('question_bank')
      .update(input)
      .eq('id', questionId)
      .select('*')
      .single();

    if (error) throw new AppError('Failed to update question: ' + error.message, 400);
    return question;
  }

  async deleteQuestion(questionId: string, userId: string, userRole: string) {
    const q = await this.getQuestionOrThrow(questionId);
    await coursesService.assertCourseAccess(q.course_id, userId, userRole);

    const { error } = await supabase
      .from('question_bank')
      .update({ is_deleted: true })
      .eq('id', questionId);

    if (error) throw new AppError('Failed to delete question', 500);
  }

  async bulkDeleteQuestions(ids: string[], userId: string, userRole: string) {
    // Verify access for each question's course
    for (const id of ids) {
      const q = await this.getQuestionOrThrow(id);
      await coursesService.assertCourseAccess(q.course_id, userId, userRole);
    }

    const { error } = await supabase
      .from('question_bank')
      .update({ is_deleted: true })
      .in('id', ids);

    if (error) throw new AppError('Failed to delete questions', 500);
  }

  // ─── Assessments ────────────────────────────────────────

  async listAssessments(query: { course_id?: string; page?: string; limit?: string }, userId: string, userRole: string) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('assessments')
      .select('*, assessment_questions(question_id)', { count: 'exact' })
      .eq('is_deleted', false);

    if (query.course_id) {
      qb = qb.eq('course_id', query.course_id);
    }

    if (userRole === 'learner') {
      qb = qb.eq('is_published', true);
    } else if (userRole === 'instructor') {
      const { data: instructedIds } = await supabase
        .from('course_instructors')
        .select('course_id')
        .eq('instructor_id', userId);
      const courseIds = instructedIds?.map((r) => r.course_id) || [];
      if (courseIds.length > 0) {
        qb = qb.in('course_id', courseIds);
      } else {
        return { assessments: [], pagination: paginationResult({ page, limit }, 0) };
      }
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: assessments, error, count } = await qb;
    if (error) throw new AppError('Failed to fetch assessments', 500);

    return {
      assessments: assessments || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async getAssessment(assessmentId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) throw new NotFoundError('Assessment');

    // Fetch assessment_questions with question details separately
    const { data: aqRows } = await supabase
      .from('assessment_questions')
      .select('question_id, sort_order')
      .eq('assessment_id', assessmentId)
      .order('sort_order', { ascending: true });

    const questionIds = (aqRows || []).map((r) => r.question_id);
    let questionMap = new Map<string, Record<string, unknown>>();
    if (questionIds.length > 0) {
      const { data: qRows } = await supabase
        .from('question_bank')
        .select('*')
        .in('id', questionIds)
        .eq('is_deleted', false);
      questionMap = new Map((qRows || []).map((q) => [q.id, q]));
    }

    const assessment_questions = (aqRows || []).map((aq) => ({
      question_id: aq.question_id,
      sort_order: aq.sort_order,
      question: questionMap.get(aq.question_id) || null,
    }));

    return { ...data, assessment_questions };
  }

  async createAssessment(input: CreateAssessmentInput, userId: string, userRole: string) {
    await coursesService.assertCourseAccess(input.course_id, userId, userRole);

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({ ...input, created_by: userId })
      .select('*')
      .single();

    if (error) throw new AppError('Failed to create assessment: ' + error.message, 400);
    return assessment;
  }

  async updateAssessment(assessmentId: string, input: UpdateAssessmentInput, userId: string, userRole: string) {
    const a = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(a.course_id, userId, userRole);

    const { data: assessment, error } = await supabase
      .from('assessments')
      .update(input)
      .eq('id', assessmentId)
      .select('*')
      .single();

    if (error) throw new AppError('Failed to update assessment: ' + error.message, 400);
    return assessment;
  }

  async deleteAssessment(assessmentId: string, userId: string, userRole: string) {
    const a = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(a.course_id, userId, userRole);

    const { error } = await supabase
      .from('assessments')
      .update({ is_deleted: true })
      .eq('id', assessmentId);

    if (error) throw new AppError('Failed to delete assessment', 500);
  }

  async addQuestions(assessmentId: string, questionIds: string[], userId: string, userRole: string) {
    const a = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(a.course_id, userId, userRole);

    // Get already-linked question IDs to avoid duplicates
    const { data: alreadyLinked } = await supabase
      .from('assessment_questions')
      .select('question_id, sort_order')
      .eq('assessment_id', assessmentId);

    const linkedSet = new Set((alreadyLinked || []).map((r) => r.question_id));
    const maxOrder = (alreadyLinked || []).reduce((max, r) => Math.max(max, r.sort_order), -1);
    let nextOrder = maxOrder + 1;

    // Filter out already-linked questions
    const newIds = questionIds.filter((id) => !linkedSet.has(id));
    if (newIds.length === 0) {
      // All questions already linked — no-op success
      return;
    }

    const rows = newIds.map((qid) => ({
      assessment_id: assessmentId,
      question_id: qid,
      sort_order: nextOrder++,
    }));

    const { data, error } = await supabase
      .from('assessment_questions')
      .insert(rows)
      .select('*');

    console.log('[addQuestions] insert result:', { assessmentId, rows: rows.length, inserted: data?.length, error });

    if (error) throw new AppError('Failed to add questions: ' + error.message, 400);
  }

  async removeQuestion(assessmentId: string, questionId: string, userId: string, userRole: string) {
    const a = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(a.course_id, userId, userRole);

    const { error } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId);

    if (error) throw new AppError('Failed to remove question', 500);
  }

  async reorderQuestions(assessmentId: string, order: { question_id: string; sort_order: number }[], userId: string, userRole: string) {
    const a = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(a.course_id, userId, userRole);

    for (const item of order) {
      const { error } = await supabase
        .from('assessment_questions')
        .update({ sort_order: item.sort_order })
        .eq('assessment_id', assessmentId)
        .eq('question_id', item.question_id);

      if (error) throw new AppError('Failed to reorder questions', 500);
    }
  }

  // ─── Submissions ────────────────────────────────────────

  async startSubmission(assessmentId: string, userId: string) {
    const assessment = await this.getAssessmentOrThrow(assessmentId);

    // Must be published
    if (!assessment.is_published) {
      throw new ValidationError('Assessment is not available');
    }

    // Check availability window
    const now = new Date();
    if (assessment.available_from && new Date(assessment.available_from) > now) {
      throw new ValidationError('Assessment is not yet available');
    }
    if (assessment.available_until && new Date(assessment.available_until) < now) {
      throw new ValidationError('Assessment is no longer available');
    }

    // Check max attempts
    const { count } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId);

    if ((count || 0) >= assessment.max_attempts) {
      throw new ValidationError('Maximum attempts reached');
    }

    // Check for existing in-progress submission
    const { data: inProgress } = await supabase
      .from('submissions')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (inProgress) {
      // Return existing submission with questions
      return this.getSubmissionForTaking(inProgress.id, assessmentId, assessment.shuffle_questions);
    }

    // Create submission
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        assessment_id: assessmentId,
        user_id: userId,
        attempt_number: (count || 0) + 1,
        status: 'in_progress',
      })
      .select('*')
      .single();

    if (error) throw new AppError('Failed to start assessment: ' + error.message, 500);

    return this.getSubmissionForTaking(submission.id, assessmentId, assessment.shuffle_questions);
  }

  async saveAnswer(submissionId: string, input: SaveAnswerInput, userId: string) {
    const sub = await this.getSubmissionOrThrow(submissionId);
    if (sub.user_id !== userId) throw new ForbiddenError('Not your submission');
    if (sub.status !== 'in_progress') throw new ValidationError('Submission is no longer in progress');

    // Upsert answer
    const { data: existing } = await supabase
      .from('submission_answers')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('question_id', input.question_id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('submission_answers')
        .update({
          answer_text: input.answer_text,
          selected_options: input.selected_options,
        })
        .eq('id', existing.id);

      if (error) throw new AppError('Failed to save answer', 500);
    } else {
      const { error } = await supabase
        .from('submission_answers')
        .insert({
          submission_id: submissionId,
          question_id: input.question_id,
          answer_text: input.answer_text,
          selected_options: input.selected_options,
        });

      if (error) throw new AppError('Failed to save answer', 500);
    }
  }

  async submitSubmission(submissionId: string, userId: string) {
    const sub = await this.getSubmissionOrThrow(submissionId);
    if (sub.user_id !== userId) throw new ForbiddenError('Not your submission');
    if (sub.status !== 'in_progress') throw new ValidationError('Already submitted');

    // Auto-grade via RPC
    const { data: result, error } = await supabase.rpc('auto_grade_submission', {
      p_submission_id: submissionId,
    });

    if (error) throw new AppError('Failed to grade submission: ' + error.message, 500);

    // Award points if passed
    if (result && result.status === 'graded') {
      const assessment = await this.getAssessmentOrThrow(sub.assessment_id);
      const percentage = result.total_points > 0
        ? (result.score / result.total_points) * 100
        : 0;

      if (percentage >= assessment.passing_score) {
        await supabase.rpc('award_points', {
          p_user_id: userId,
          p_points: 25,
          p_reason: 'Assessment passed',
          p_ref_id: sub.assessment_id,
        });
      }
    }

    return result;
  }

  async getSubmissionResults(submissionId: string, userId: string, userRole: string) {
    const sub = await this.getSubmissionOrThrow(submissionId);

    // Only the owner or instructor/admin can view results
    if (sub.user_id !== userId && userRole !== 'admin') {
      // Check if instructor has access to the assessment's course
      const assessment = await this.getAssessmentOrThrow(sub.assessment_id);
      await coursesService.assertCourseAccess(assessment.course_id, userId, userRole);
    }

    if (sub.status === 'in_progress') {
      throw new ValidationError('Submission has not been submitted yet');
    }

    const { data: answers, error } = await supabase
      .from('submission_answers')
      .select('*, question:question_bank(question_text, question_type, options, correct_answer, points, explanation)')
      .eq('submission_id', submissionId);

    if (error) throw new AppError('Failed to fetch results', 500);

    return {
      submission: sub,
      answers: answers || [],
    };
  }

  async getMySubmissions(assessmentId: string, userId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, attempt_number, status, score, total_points, started_at, submitted_at')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false });

    if (error) throw new AppError('Failed to fetch submissions', 500);
    return { submissions: data || [] };
  }

  // ─── Grading ──────────────────────────────────────────

  async listSubmissions(assessmentId: string, query: { status?: string; page?: string; limit?: string }, userId: string, userRole: string) {
    const assessment = await this.getAssessmentOrThrow(assessmentId);
    await coursesService.assertCourseAccess(assessment.course_id, userId, userRole);

    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('submissions')
      .select('*, user:profiles(id, first_name, last_name, email, avatar_url)', { count: 'exact' })
      .eq('assessment_id', assessmentId);

    if (query.status) {
      qb = qb.eq('status', query.status);
    }

    qb = qb.order('submitted_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await qb;
    if (error) throw new AppError('Failed to fetch submissions', 500);

    return {
      submissions: submissions || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async gradeSubmission(submissionId: string, input: GradeSubmissionInput, userId: string, userRole: string) {
    const sub = await this.getSubmissionOrThrow(submissionId);
    const assessment = await this.getAssessmentOrThrow(sub.assessment_id);
    await coursesService.assertCourseAccess(assessment.course_id, userId, userRole);

    if (sub.status === 'in_progress') {
      throw new ValidationError('Submission has not been submitted yet');
    }

    // Update each answer's points and feedback
    for (const answer of input.answers) {
      const { error } = await supabase
        .from('submission_answers')
        .update({
          points_awarded: answer.points_awarded,
          feedback: answer.feedback,
          is_correct: answer.points_awarded > 0,
        })
        .eq('submission_id', submissionId)
        .eq('question_id', answer.question_id);

      if (error) throw new AppError('Failed to grade answer', 500);
    }

    // Recalculate total score
    const { data: allAnswers } = await supabase
      .from('submission_answers')
      .select('points_awarded')
      .eq('submission_id', submissionId);

    const totalScore = (allAnswers || []).reduce((sum, a) => sum + (a.points_awarded || 0), 0);

    // Get total possible points
    const { data: answerRows } = await supabase
      .from('submission_answers')
      .select('question_id')
      .eq('submission_id', submissionId);

    let totalPoints = 0;
    for (const row of answerRows || []) {
      const { data: q } = await supabase
        .from('question_bank')
        .select('points')
        .eq('id', row.question_id)
        .single();
      totalPoints += q?.points || 0;
    }

    // Update submission
    const { data: updated, error: updateErr } = await supabase
      .from('submissions')
      .update({
        score: totalScore,
        total_points: totalPoints,
        status: 'graded',
        graded_at: new Date().toISOString(),
        graded_by: userId,
      })
      .eq('id', submissionId)
      .select('*')
      .single();

    if (updateErr) throw new AppError('Failed to update submission', 500);

    // Award points if passed
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    if (percentage >= assessment.passing_score) {
      await supabase.rpc('award_points', {
        p_user_id: sub.user_id,
        p_points: 25,
        p_reason: 'Assessment passed',
        p_ref_id: sub.assessment_id,
      });
    }

    return updated;
  }

  // ─── Helpers ──────────────────────────────────────────

  private async getQuestionOrThrow(questionId: string) {
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', questionId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) throw new NotFoundError('Question');
    return data;
  }

  private async getAssessmentOrThrow(assessmentId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) throw new NotFoundError('Assessment');
    return data;
  }

  private async getSubmissionOrThrow(submissionId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !data) throw new NotFoundError('Submission');
    return data;
  }

  private async getSubmissionForTaking(submissionId: string, assessmentId: string, shuffle: boolean) {
    // Get assessment_questions rows (just IDs and order)
    const { data: aqRows, error: aqError } = await supabase
      .from('assessment_questions')
      .select('question_id, sort_order')
      .eq('assessment_id', assessmentId)
      .order('sort_order', { ascending: true });

    console.log('[getSubmissionForTaking] assessment_questions query:', { assessmentId, rows: aqRows?.length, error: aqError });

    const questionIds = (aqRows || []).map((r) => r.question_id);

    // Fetch question details separately (avoids embedded-select join issues)
    let questionList: Record<string, unknown>[] = [];
    if (questionIds.length > 0) {
      const { data: qRows, error: qError } = await supabase
        .from('question_bank')
        .select('id, question_type, question_text, options, points')
        .in('id', questionIds)
        .eq('is_deleted', false);

      console.log('[getSubmissionForTaking] question_bank query:', { questionIds, qRowsCount: qRows?.length, error: qError });

      // Preserve sort order from assessment_questions
      const qMap = new Map((qRows || []).map((q) => [q.id, q]));
      questionList = questionIds.map((id) => qMap.get(id)).filter(Boolean) as Record<string, unknown>[];
    }

    // Get existing answers
    const { data: answers } = await supabase
      .from('submission_answers')
      .select('question_id, answer_text, selected_options')
      .eq('submission_id', submissionId);

    // Get submission details
    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    // Get assessment for time info
    const { data: assessment } = await supabase
      .from('assessments')
      .select('time_limit_minutes, title')
      .eq('id', assessmentId)
      .single();

    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = questionList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionList[i], questionList[j]] = [questionList[j], questionList[i]];
      }
    }

    return {
      submission,
      assessment: { title: assessment?.title, time_limit_minutes: assessment?.time_limit_minutes },
      questions: questionList,
      answers: answers || [],
    };
  }
}

export const assessmentsService = new AssessmentsService();
