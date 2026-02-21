import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import { coursesService } from '../courses/courses.service.js';
import type {
  CreateModuleInput,
  UpdateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
} from './content.validators.js';

export class ContentService {
  // ─── Modules ──────────────────────────────────────────

  async createModule(courseId: string, input: CreateModuleInput, userId: string, userRole: string) {
    await coursesService.assertCourseAccess(courseId, userId, userRole);

    // Auto-set sort_order to max+1
    const { data: existing } = await supabase
      .from('modules')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data: mod, error } = await supabase
      .from('modules')
      .insert({
        ...input,
        course_id: courseId,
        sort_order: nextOrder,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create module: ' + error.message, 400);
    }

    return mod;
  }

  async updateModule(moduleId: string, input: UpdateModuleInput, userId: string, userRole: string) {
    const mod = await this.getModuleOrThrow(moduleId);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    const { data: updated, error } = await supabase
      .from('modules')
      .update(input)
      .eq('id', moduleId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update module: ' + error.message, 400);
    }

    return updated;
  }

  async deleteModule(moduleId: string, userId: string, userRole: string) {
    const mod = await this.getModuleOrThrow(moduleId);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      throw new AppError('Failed to delete module: ' + error.message, 500);
    }
  }

  async reorderModules(courseId: string, order: { id: string; sort_order: number }[], userId: string, userRole: string) {
    await coursesService.assertCourseAccess(courseId, userId, userRole);

    // Batch update sort_order values
    for (const item of order) {
      const { error } = await supabase
        .from('modules')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('course_id', courseId);

      if (error) {
        throw new AppError('Failed to reorder modules: ' + error.message, 500);
      }
    }
  }

  // ─── Lessons ──────────────────────────────────────────

  async createLesson(moduleId: string, input: CreateLessonInput, userId: string, userRole: string) {
    const mod = await this.getModuleOrThrow(moduleId);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    // Auto-set sort_order
    const { data: existing } = await supabase
      .from('lessons')
      .select('sort_order')
      .eq('module_id', moduleId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        ...input,
        module_id: moduleId,
        sort_order: nextOrder,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create lesson: ' + error.message, 400);
    }

    return lesson;
  }

  async updateLesson(lessonId: string, input: UpdateLessonInput, userId: string, userRole: string) {
    const lesson = await this.getLessonOrThrow(lessonId);
    const mod = await this.getModuleOrThrow(lesson.module_id);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    const { data: updated, error } = await supabase
      .from('lessons')
      .update(input)
      .eq('id', lessonId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update lesson: ' + error.message, 400);
    }

    return updated;
  }

  async deleteLesson(lessonId: string, userId: string, userRole: string) {
    const lesson = await this.getLessonOrThrow(lessonId);
    const mod = await this.getModuleOrThrow(lesson.module_id);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      throw new AppError('Failed to delete lesson: ' + error.message, 500);
    }
  }

  async reorderLessons(moduleId: string, order: { id: string; sort_order: number }[], userId: string, userRole: string) {
    const mod = await this.getModuleOrThrow(moduleId);
    await coursesService.assertCourseAccess(mod.course_id, userId, userRole);

    for (const item of order) {
      const { error } = await supabase
        .from('lessons')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('module_id', moduleId);

      if (error) {
        throw new AppError('Failed to reorder lessons: ' + error.message, 500);
      }
    }
  }

  // ─── File Upload ──────────────────────────────────────

  async uploadFile(file: Express.Multer.File, userId: string) {
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('course-content')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new AppError('Failed to upload file: ' + error.message, 500);
    }

    const { data: urlData } = supabase.storage
      .from('course-content')
      .getPublicUrl(path);

    return { url: urlData.publicUrl };
  }

  // ─── Helpers ──────────────────────────────────────────

  private async getModuleOrThrow(moduleId: string) {
    const { data: mod, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (error || !mod) {
      throw new NotFoundError('Module');
    }

    return mod;
  }

  private async getLessonOrThrow(lessonId: string) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      throw new NotFoundError('Lesson');
    }

    return lesson;
  }
}

export const contentService = new ContentService();
