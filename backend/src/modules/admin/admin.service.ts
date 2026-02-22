import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors.js';
import { parsePagination, paginationResult } from '../../utils/pagination.js';
import type {
  UsersQuery,
  CreateBundleInput,
  UpdateBundleInput,
  ManageBundleCoursesInput,
  AuditLogsQuery,
} from './admin.validators.js';

export class AdminService {
  // ─── Dashboard ──────────────────────────────────────────

  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    if (error) {
      throw new AppError('Failed to fetch dashboard stats: ' + error.message, 500);
    }
    return data;
  }

  async getInstructorStats(instructorId: string) {
    const { data, error } = await supabase.rpc('get_instructor_stats', {
      p_instructor_id: instructorId,
    });
    if (error) {
      throw new AppError('Failed to fetch instructor stats: ' + error.message, 500);
    }
    return data;
  }

  // ─── Users ──────────────────────────────────────────────

  async listUsers(query: UsersQuery) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (query.search) {
      qb = qb.or(
        `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%`,
      );
    }
    if (query.role) {
      qb = qb.eq('role', query.role);
    }
    if (query.is_active === 'true') {
      qb = qb.eq('is_active', true);
    } else if (query.is_active === 'false') {
      qb = qb.eq('is_active', false);
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch users: ' + error.message, 500);
    }

    return {
      users: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update user role: ' + error.message, 500);
    }

    return data;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update user status: ' + error.message, 500);
    }

    return data;
  }

  // ─── Bundles ────────────────────────────────────────────

  async listBundles(query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('course_bundles')
      .select(`
        *,
        bundle_courses(
          course_id,
          sort_order,
          course:courses(id, title, slug, thumbnail_url, status)
        )
      `, { count: 'exact' })
      .eq('is_deleted', false);

    if (query.search) {
      qb = qb.ilike('title', `%${query.search}%`);
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch bundles: ' + error.message, 500);
    }

    return {
      bundles: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async createBundle(input: CreateBundleInput, userId: string) {
    const { data, error } = await supabase
      .from('course_bundles')
      .insert({
        title: input.title,
        description: input.description || null,
        thumbnail_url: input.thumbnail_url || null,
        is_sequential: input.is_sequential || false,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create bundle: ' + error.message, 500);
    }

    return data;
  }

  async updateBundle(bundleId: string, input: UpdateBundleInput) {
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.thumbnail_url !== undefined) updates.thumbnail_url = input.thumbnail_url || null;
    if (input.is_sequential !== undefined) updates.is_sequential = input.is_sequential;

    const { data, error } = await supabase
      .from('course_bundles')
      .update(updates)
      .eq('id', bundleId)
      .eq('is_deleted', false)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update bundle: ' + error.message, 500);
    }

    return data;
  }

  async deleteBundle(bundleId: string) {
    await supabase
      .from('course_bundles')
      .update({ is_deleted: true })
      .eq('id', bundleId);
  }

  async manageBundleCourses(bundleId: string, input: ManageBundleCoursesInput) {
    // Delete existing
    await supabase
      .from('bundle_courses')
      .delete()
      .eq('bundle_id', bundleId);

    if (input.courses.length === 0) return;

    // Insert new
    const rows = input.courses.map((c) => ({
      bundle_id: bundleId,
      course_id: c.course_id,
      sort_order: c.sort_order,
    }));

    const { error } = await supabase.from('bundle_courses').insert(rows);

    if (error) {
      throw new AppError('Failed to manage bundle courses: ' + error.message, 500);
    }
  }

  // ─── Audit Logs ─────────────────────────────────────────

  async listAuditLogs(query: AuditLogsQuery) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles!audit_logs_user_id_fkey(id, first_name, last_name, email)
      `, { count: 'exact' });

    if (query.user_id) {
      qb = qb.eq('user_id', query.user_id);
    }
    if (query.action) {
      qb = qb.eq('action', query.action);
    }
    if (query.resource) {
      qb = qb.eq('resource', query.resource);
    }
    if (query.from) {
      qb = qb.gte('created_at', query.from);
    }
    if (query.to) {
      qb = qb.lte('created_at', query.to);
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch audit logs: ' + error.message, 500);
    }

    return {
      logs: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async exportAuditLogs(query: AuditLogsQuery) {
    // Fetch all matching logs (up to 5000)
    let qb = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles!audit_logs_user_id_fkey(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (query.user_id) qb = qb.eq('user_id', query.user_id);
    if (query.action) qb = qb.eq('action', query.action);
    if (query.resource) qb = qb.eq('resource', query.resource);
    if (query.from) qb = qb.gte('created_at', query.from);
    if (query.to) qb = qb.lte('created_at', query.to);

    const { data, error } = await qb;

    if (error) {
      throw new AppError('Failed to export audit logs: ' + error.message, 500);
    }

    // Convert to CSV
    const rows = (data || []).map((log) => {
      const user = log.user as { first_name: string; last_name: string; email: string } | null;
      return [
        log.created_at,
        user ? `${user.first_name} ${user.last_name}` : '',
        user?.email || '',
        log.action,
        log.resource,
        log.resource_id || '',
        log.ip_address || '',
        JSON.stringify(log.changes || {}),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const header = 'Date,User,Email,Action,Resource,Resource ID,IP Address,Changes';
    return header + '\n' + rows.join('\n');
  }

  // ─── Integrations ──────────────────────────────────────

  async listIntegrations() {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .order('provider', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch integrations', 500);
    }

    return { integrations: data || [] };
  }

  async updateIntegration(integrationId: string, input: { config?: Record<string, unknown>; is_enabled?: boolean }) {
    const updates: Record<string, unknown> = {};
    if (input.config !== undefined) updates.config = input.config;
    if (input.is_enabled !== undefined) updates.is_enabled = input.is_enabled;

    const { data, error } = await supabase
      .from('integration_configs')
      .update(updates)
      .eq('id', integrationId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to update integration: ' + error.message, 500);
    }

    return data;
  }

  // ─── Instructor Analytics ──────────────────────────────

  async getCourseAnalytics(courseId: string) {
    // Enrollment trend (last 30 days)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('created_at, status, progress, user_id')
      .eq('course_id', courseId);

    const enrollmentTrend: Record<string, number> = {};
    for (const e of enrollments || []) {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      enrollmentTrend[date] = (enrollmentTrend[date] || 0) + 1;
    }

    const totalStudents = (enrollments || []).length;
    const avgProgress = totalStudents > 0
      ? Math.round((enrollments || []).reduce((s, e) => s + (e.progress || 0), 0) / totalStudents)
      : 0;

    // At-risk learners (enrolled, progress < 20%, enrolled > 7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const atRisk = (enrollments || []).filter(
      (e) => e.status === 'active' && (e.progress || 0) < 20 && e.created_at < sevenDaysAgo,
    );

    // Fetch at-risk user profiles
    const atRiskUserIds = atRisk.map((e) => e.user_id);
    let atRiskProfiles: Array<{ id: string; first_name: string; last_name: string; email: string }> = [];
    if (atRiskUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', atRiskUserIds);
      atRiskProfiles = profiles || [];
    }

    const atRiskLearners = atRisk.map((e) => {
      const profile = atRiskProfiles.find((p) => p.id === e.user_id);
      return {
        user_id: e.user_id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        email: profile?.email || '',
        progress: e.progress || 0,
        enrolled_at: e.created_at,
      };
    });

    // Assessment scores
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title')
      .eq('course_id', courseId);

    const assessmentIds = (assessments || []).map((a) => a.id);

    let scoreDistribution: Array<{ assessment_title: string; avg_score: number; submissions: number }> = [];
    if (assessmentIds.length > 0) {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assessment_id, score, total_points')
        .in('assessment_id', assessmentIds)
        .eq('status', 'graded');

      const assessmentMap = new Map((assessments || []).map((a) => [a.id, a.title]));
      const grouped: Record<string, { scores: number[]; count: number }> = {};

      for (const s of submissions || []) {
        const key = s.assessment_id;
        if (!grouped[key]) grouped[key] = { scores: [], count: 0 };
        grouped[key].count += 1;
        if (s.total_points && s.total_points > 0) {
          grouped[key].scores.push((s.score || 0) / s.total_points * 100);
        }
      }

      scoreDistribution = Object.entries(grouped).map(([id, data]) => ({
        assessment_title: assessmentMap.get(id) || 'Unknown',
        avg_score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
        submissions: data.count,
      }));
    }

    return {
      total_students: totalStudents,
      avg_progress: avgProgress,
      enrollment_trend: Object.entries(enrollmentTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      at_risk_learners: atRiskLearners,
      score_distribution: scoreDistribution,
      completed: (enrollments || []).filter((e) => e.status === 'completed').length,
    };
  }
}

export const adminService = new AdminService();
