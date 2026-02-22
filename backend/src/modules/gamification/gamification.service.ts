import { supabase } from '../../lib/supabase.js';
import { AppError } from '../../lib/errors.js';
import type { LeaderboardQuery } from './gamification.validators.js';

interface BadgeCriteria {
  type: string;
  count?: number;
  days?: number;
}

export class GamificationService {
  async getLeaderboard(query: LeaderboardQuery) {
    const scope = query.scope || 'global';
    const scopeId = query.scope_id || null;
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);

    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_scope: scope,
      p_scope_id: scopeId,
      p_limit: limit,
    });

    if (error) {
      throw new AppError('Failed to fetch leaderboard: ' + error.message, 500);
    }

    return { leaderboard: data || [] };
  }

  async getMyStats(userId: string) {
    // Get profile stats
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('points, level, streak_days')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      throw new AppError('Failed to fetch stats', 500);
    }

    // Get badge count
    const { count: badgeCount } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total badges available
    const { count: totalBadges } = await supabase
      .from('badges')
      .select('id', { count: 'exact', head: true });

    // Get recent points history (last 10)
    const { data: recentPoints } = await supabase
      .from('points_ledger')
      .select('id, points, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get global rank
    const { data: rankData } = await supabase.rpc('get_leaderboard', {
      p_scope: 'global',
      p_scope_id: null,
      p_limit: 1000,
    });

    let rank: number | null = null;
    if (rankData) {
      const entry = (rankData as Array<{ user_id: string; rank: number }>).find(
        (e) => e.user_id === userId,
      );
      rank = entry ? Number(entry.rank) : null;
    }

    return {
      points: profile.points,
      level: profile.level,
      streak_days: profile.streak_days,
      rank,
      badges_earned: badgeCount || 0,
      badges_total: totalBadges || 0,
      recent_points: recentPoints || [],
    };
  }

  async getBadges(userId: string) {
    // Get all badges
    const { data: badges, error } = await supabase
      .from('badges')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new AppError('Failed to fetch badges', 500);
    }

    // Get user's earned badges
    const { data: earned } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId);

    const earnedMap = new Map(
      (earned || []).map((e) => [e.badge_id, e.earned_at]),
    );

    const result = (badges || []).map((badge) => ({
      ...badge,
      earned: earnedMap.has(badge.id),
      earned_at: earnedMap.get(badge.id) || null,
    }));

    return { badges: result };
  }

  /**
   * Check and award badges after a relevant action.
   * Called internally by other services after events like lesson completion, quiz pass, etc.
   */
  async checkAndAwardBadges(userId: string, eventType: string) {
    // Get all badges the user hasn't earned yet
    const { data: badges } = await supabase
      .from('badges')
      .select('*');

    const { data: earned } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedIds = new Set((earned || []).map((e) => e.badge_id));
    const unearned = (badges || []).filter((b) => !earnedIds.has(b.id));

    const newBadges: Array<{ id: string; name: string }> = [];

    for (const badge of unearned) {
      const criteria = badge.criteria as BadgeCriteria;
      if (!criteria?.type) continue;

      // Only check badges relevant to the current event type
      if (!this.isRelevantEvent(criteria.type, eventType)) continue;

      const met = await this.checkCriteria(userId, criteria);
      if (met) {
        const { error } = await supabase
          .from('user_badges')
          .insert({ user_id: userId, badge_id: badge.id });

        if (!error) {
          newBadges.push({ id: badge.id, name: badge.name });

          // Create notification for badge award
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'badge_earned',
            title: 'Badge Earned!',
            body: `You earned the "${badge.name}" badge!`,
            reference_url: '/learner/leaderboard',
          });
        }
      }
    }

    return newBadges;
  }

  private isRelevantEvent(criteriaType: string, eventType: string): boolean {
    const mapping: Record<string, string[]> = {
      lesson_complete: ['lesson_complete'],
      quiz_pass: ['quiz_pass', 'assessment_submit'],
      course_complete: ['course_complete'],
      bundle_complete: ['bundle_complete'],
      forum_posts: ['forum_post'],
      streak: ['lesson_complete', 'login'],
      perfect_score: ['quiz_pass', 'assessment_submit'],
      enrollments: ['enroll'],
    };
    return (mapping[criteriaType] || []).includes(eventType);
  }

  private async checkCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    switch (criteria.type) {
      case 'lesson_complete': {
        const { count } = await supabase
          .from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_completed', true);
        return (count || 0) >= (criteria.count || 1);
      }

      case 'quiz_pass': {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['graded', 'submitted']);
        return (count || 0) >= (criteria.count || 1);
      }

      case 'course_complete': {
        const { count } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'completed');
        return (count || 0) >= (criteria.count || 1);
      }

      case 'bundle_complete': {
        // Check if user completed all courses in any bundle
        const { data: bundles } = await supabase
          .from('course_bundles')
          .select('id');

        for (const bundle of bundles || []) {
          const { data: bundleCourses } = await supabase
            .from('bundle_courses')
            .select('course_id')
            .eq('bundle_id', bundle.id);

          if (!bundleCourses || bundleCourses.length === 0) continue;

          const courseIds = bundleCourses.map((bc) => bc.course_id);
          const { count } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .in('course_id', courseIds);

          if ((count || 0) >= courseIds.length) return true;
        }
        return false;
      }

      case 'forum_posts': {
        const { count } = await supabase
          .from('forum_posts')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId);
        return (count || 0) >= (criteria.count || 10);
      }

      case 'streak': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_days')
          .eq('id', userId)
          .single();
        return (profile?.streak_days || 0) >= (criteria.days || 7);
      }

      case 'perfect_score': {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'graded')
          .filter('score', 'eq', 'total_points');

        // The above filter won't work for comparing two columns,
        // so use a raw approach
        if (count === null) {
          const { data: subs } = await supabase
            .from('submissions')
            .select('score, total_points')
            .eq('user_id', userId)
            .eq('status', 'graded');

          const perfects = (subs || []).filter(
            (s) => s.total_points && s.total_points > 0 && s.score === s.total_points,
          );
          return perfects.length >= (criteria.count || 1);
        }
        return false;
      }

      case 'enrollments': {
        const { count } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'dropped');
        return (count || 0) >= (criteria.count || 5);
      }

      default:
        return false;
    }
  }

  /**
   * Update the user's daily streak.
   * Called when a user completes any learning activity.
   */
  async updateStreak(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, last_active_at')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const now = new Date();
    const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;

    let newStreak = profile.streak_days || 0;

    if (lastActive) {
      const diffMs = now.getTime() - lastActive.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= 24 && diffHours < 48) {
        // Next day — increment streak
        newStreak += 1;
      } else if (diffHours >= 48) {
        // Missed a day — reset streak
        newStreak = 1;
      }
      // Same day — don't change streak
    } else {
      // First activity
      newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({
        streak_days: newStreak,
        last_active_at: now.toISOString(),
      })
      .eq('id', userId);

    // Award streak bonus at 7 days
    if (newStreak === 7 && (profile.streak_days || 0) < 7) {
      await supabase.rpc('award_points', {
        p_user_id: userId,
        p_points: 50,
        p_reason: '7-day learning streak',
        p_ref_id: null,
      });
    }
  }
}

export const gamificationService = new GamificationService();
