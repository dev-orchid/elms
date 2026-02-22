import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { parsePagination, paginationResult } from '../../utils/pagination.js';
import type { MyEnrollmentsQuery } from './enrollments.validators.js';

export class EnrollmentsService {
  async enroll(courseId: string, userId: string) {
    // Verify course exists, is published, not deleted
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, status, is_deleted, max_enrollments')
      .eq('id', courseId)
      .single();

    if (courseErr || !course) {
      throw new NotFoundError('Course');
    }
    if (course.is_deleted) {
      throw new NotFoundError('Course');
    }
    if (course.status !== 'published') {
      throw new ValidationError('Can only enroll in published courses');
    }

    // Check max enrollments
    if (course.max_enrollments) {
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .neq('status', 'dropped');

      if ((count || 0) >= course.max_enrollments) {
        throw new ValidationError('This course has reached its maximum enrollment capacity');
      }
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      if (existing.status === 'dropped') {
        // Re-enroll: reactivate
        const { data: enrollment, error } = await supabase
          .from('enrollments')
          .update({ status: 'active', progress: 0, completed_at: null })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) throw new AppError('Failed to re-enroll: ' + error.message, 500);

        return enrollment;
      }
      throw new ValidationError('Already enrolled in this course');
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        progress: 0,
      })
      .select('*')
      .single();

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new ValidationError('Already enrolled in this course');
      }
      throw new AppError('Failed to enroll: ' + error.message, 500);
    }

    return enrollment;
  }

  async getMyEnrollments(userId: string, query: MyEnrollmentsQuery) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(
          id, title, slug, description, thumbnail_url, status, difficulty,
          estimated_hours,
          course_instructors(
            profile:profiles(id, first_name, last_name, avatar_url)
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (query.status) {
      qb = qb.eq('status', query.status);
    }

    qb = qb.order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: enrollments, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch enrollments', 500);
    }

    return {
      enrollments: enrollments || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async completeLesson(lessonId: string, userId: string) {
    // Verify lesson exists and get its module/course
    const { data: lesson, error: lessonErr } = await supabase
      .from('lessons')
      .select('id, module_id')
      .eq('id', lessonId)
      .single();

    if (lessonErr || !lesson) {
      throw new NotFoundError('Lesson');
    }

    // Get the course ID from the module
    const { data: mod } = await supabase
      .from('modules')
      .select('course_id')
      .eq('id', lesson.module_id)
      .single();

    if (!mod) {
      throw new NotFoundError('Module');
    }

    const courseId = mod.course_id;

    // Verify user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      throw new ValidationError('You must be enrolled in this course to track progress');
    }

    // Upsert lesson_progress
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id, is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (existing?.is_completed) {
      // Already completed — return current progress
      return this.getCourseProgress(courseId, userId);
    }

    if (existing) {
      await supabase
        .from('lesson_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const { error: insertErr } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (insertErr) {
        throw new AppError('Failed to mark lesson complete: ' + insertErr.message, 500);
      }
    }

    // Award 10 points for lesson completion
    await supabase.rpc('award_points', {
      p_user_id: userId,
      p_points: 10,
      p_reason: 'Lesson completed',
      p_ref_id: lessonId,
    });

    // Recalculate course progress
    await supabase.rpc('calculate_course_progress', {
      p_user_id: userId,
      p_course_id: courseId,
    });

    // Check if course is now complete
    await supabase.rpc('check_course_completion', {
      p_user_id: userId,
      p_course_id: courseId,
    });

    return this.getCourseProgress(courseId, userId);
  }

  async getCourseProgress(courseId: string, userId: string) {
    // Get enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status, progress, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      return { enrolled: false, progress: 0, status: null, completed_lessons: 0, total_lessons: 0, next_lesson_id: null };
    }

    // Count total lessons in course
    const { data: modules } = await supabase
      .from('modules')
      .select('id, sort_order, lessons(id, sort_order)')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    const allLessons: { id: string; module_sort: number; lesson_sort: number }[] = [];
    for (const mod of modules || []) {
      const lessons = mod.lessons || [];
      for (const l of lessons) {
        allLessons.push({ id: l.id, module_sort: mod.sort_order, lesson_sort: l.sort_order });
      }
    }
    allLessons.sort((a, b) => a.module_sort - b.module_sort || a.lesson_sort - b.lesson_sort);

    // Get completed lesson IDs
    const { data: completedRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('lesson_id', allLessons.map((l) => l.id));

    const completedSet = new Set((completedRows || []).map((r) => r.lesson_id));

    // Find next incomplete lesson
    const nextLesson = allLessons.find((l) => !completedSet.has(l.id));

    // Compute progress dynamically from actual completion data
    const computedProgress = allLessons.length > 0
      ? Math.round((completedSet.size / allLessons.length) * 100)
      : 0;

    // Sync stored progress if it differs
    const storedProgress = Number(enrollment.progress) || 0;
    if (Math.round(storedProgress) !== computedProgress) {
      await supabase
        .from('enrollments')
        .update({ progress: computedProgress })
        .eq('id', enrollment.id);
    }

    return {
      enrolled: true,
      progress: computedProgress,
      status: enrollment.status,
      completed_at: enrollment.completed_at,
      completed_lessons: completedSet.size,
      total_lessons: allLessons.length,
      next_lesson_id: nextLesson?.id || null,
      completed_lesson_ids: Array.from(completedSet),
    };
  }

}

export const enrollmentsService = new EnrollmentsService();
