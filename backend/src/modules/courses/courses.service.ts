import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors.js';
import { parsePagination, paginationResult } from '../../utils/pagination.js';
import { generateUniqueSlug } from '../../utils/slug.js';
import type { CreateCourseInput, UpdateCourseInput, CourseQuery } from './courses.validators.js';

export class CoursesService {
  async list(query: CourseQuery, userRole: string, userId: string) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('courses')
      .select('*, course_instructors(profile:profiles(id, first_name, last_name, avatar_url))', { count: 'exact' })
      .eq('is_deleted', false);

    // Role-aware filtering
    if (userRole === 'learner') {
      qb = qb.eq('status', 'published');
    } else if (userRole === 'instructor') {
      // Instructors see published courses + their own drafts
      // Use an OR filter: published, or courses they instruct
      const { data: instructedIds } = await supabase
        .from('course_instructors')
        .select('course_id')
        .eq('instructor_id', userId);

      const courseIds = instructedIds?.map((r) => r.course_id) || [];

      if (courseIds.length > 0) {
        qb = qb.or(`status.eq.published,id.in.(${courseIds.join(',')})`);
      } else {
        qb = qb.eq('status', 'published');
      }
    }
    // Admins / super_admins see all non-deleted

    // Filters
    if (query.status) {
      qb = qb.eq('status', query.status);
    }
    if (query.difficulty) {
      qb = qb.eq('difficulty', query.difficulty);
    }
    if (query.search) {
      qb = qb.ilike('title', `%${query.search}%`);
    }

    // Sort
    switch (query.sort) {
      case 'oldest':
        qb = qb.order('created_at', { ascending: true });
        break;
      case 'title':
        qb = qb.order('title', { ascending: true });
        break;
      case 'popular':
        qb = qb.order('enrollment_count', { ascending: false });
        break;
      default:
        qb = qb.order('created_at', { ascending: false });
    }

    qb = qb.range(offset, offset + limit - 1);

    const { data: courses, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch courses', 500);
    }

    return {
      courses: courses || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async getBySlug(slug: string) {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules(
          *,
          lessons(*)
        ),
        course_instructors(
          *,
          profile:profiles(id, first_name, last_name, email, avatar_url)
        )
      `)
      .eq('slug', slug)
      .eq('is_deleted', false)
      .order('sort_order', { referencedTable: 'modules', ascending: true })
      .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
      .single();

    if (error || !course) {
      throw new NotFoundError('Course');
    }

    return course;
  }

  async getById(courseId: string) {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules(
          *,
          lessons(*)
        ),
        course_instructors(
          *,
          profile:profiles(id, first_name, last_name, email, avatar_url)
        )
      `)
      .eq('id', courseId)
      .eq('is_deleted', false)
      .order('sort_order', { referencedTable: 'modules', ascending: true })
      .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
      .single();

    if (error || !course) {
      throw new NotFoundError('Course');
    }

    return course;
  }

  async create(input: CreateCourseInput, userId: string) {
    const slug = generateUniqueSlug(input.title);

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...input,
        slug,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create course: ' + error.message, 400);
    }

    // Add creator as lead instructor
    const { error: instrError } = await supabase
      .from('course_instructors')
      .insert({
        course_id: course.id,
        instructor_id: userId,
        role: 'lead',
      });

    if (instrError) {
      console.error('Failed to add creator as instructor:', instrError.message);
    }

    return course;
  }

  async update(courseId: string, input: UpdateCourseInput, userId: string, userRole: string) {
    await this.assertCourseAccess(courseId, userId, userRole);

    const updateData: Record<string, unknown> = { ...input };

    // Regenerate slug if title changed
    if (input.title) {
      updateData.slug = generateUniqueSlug(input.title);
    }

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update course: ' + error.message, 400);
    }

    return course;
  }

  async publish(courseId: string, userId: string, userRole: string) {
    await this.assertCourseAccess(courseId, userId, userRole);

    // Validate: must have at least 1 module with at least 1 lesson
    const { data: modules } = await supabase
      .from('modules')
      .select('id, lessons(id)')
      .eq('course_id', courseId);

    if (!modules || modules.length === 0) {
      throw new ValidationError('Course must have at least one module before publishing');
    }

    const hasLessons = modules.some((m) => m.lessons && m.lessons.length > 0);
    if (!hasLessons) {
      throw new ValidationError('Course must have at least one lesson before publishing');
    }

    const { data: course, error } = await supabase
      .from('courses')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to publish course', 500);
    }

    return course;
  }

  async archive(courseId: string) {
    const { data: course, error } = await supabase
      .from('courses')
      .update({ status: 'archived' })
      .eq('id', courseId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to archive course', 500);
    }

    return course;
  }

  async softDelete(courseId: string) {
    const { data: course, error } = await supabase
      .from('courses')
      .update({ is_deleted: true })
      .eq('id', courseId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to delete course', 500);
    }

    return course;
  }

  async addInstructor(courseId: string, instructorId: string, role: string, userId: string, userRole: string) {
    await this.assertCourseAccess(courseId, userId, userRole);

    // Verify the instructor user exists and has instructor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', instructorId)
      .single();

    if (!profile) {
      throw new NotFoundError('Instructor');
    }

    const { data: instructor, error } = await supabase
      .from('course_instructors')
      .insert({
        course_id: courseId,
        instructor_id: instructorId,
        role,
      })
      .select('*, profile:profiles(id, first_name, last_name, email, avatar_url)')
      .single();

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new ValidationError('Instructor already assigned to this course');
      }
      throw new AppError('Failed to add instructor: ' + error.message, 400);
    }

    return instructor;
  }

  async removeInstructor(courseId: string, instructorId: string, userId: string, userRole: string) {
    await this.assertCourseAccess(courseId, userId, userRole);

    // Don't allow removing the last lead instructor
    const { data: leads } = await supabase
      .from('course_instructors')
      .select('instructor_id')
      .eq('course_id', courseId)
      .eq('role', 'lead');

    if (leads && leads.length === 1 && leads[0].instructor_id === instructorId) {
      throw new ValidationError('Cannot remove the last lead instructor');
    }

    const { error } = await supabase
      .from('course_instructors')
      .delete()
      .eq('course_id', courseId)
      .eq('instructor_id', instructorId);

    if (error) {
      throw new AppError('Failed to remove instructor', 500);
    }
  }

  async assertCourseAccess(courseId: string, userId: string, userRole: string) {
    if (userRole === 'admin' || userRole === 'super_admin') {
      return;
    }

    const { data: assignment } = await supabase
      .from('course_instructors')
      .select('course_id')
      .eq('course_id', courseId)
      .eq('instructor_id', userId)
      .single();

    if (!assignment) {
      throw new ForbiddenError('You do not have access to this course');
    }
  }
}

export const coursesService = new CoursesService();
