'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import {
  BookOpen,
  Award,
  TrendingUp,
  PlayCircle,
  Trophy,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import api from '@/lib/api';

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  updated_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string;
    course_instructors?: Array<{
      profile: { first_name: string; last_name: string };
    }>;
  };
}

const quickActions = [
  { label: 'Browse Courses', icon: BookOpen, href: '/learner/courses', color: 'text-blue-600' },
  { label: 'Continue Learning', icon: PlayCircle, href: '/learner/my-learning', color: 'text-emerald-600' },
  { label: 'Certificates', icon: Award, href: '/learner/certificates', color: 'text-amber-600' },
  { label: 'Leaderboard', icon: Trophy, href: '/learner/leaderboard', color: 'text-purple-600' },
];

export default function LearnerDashboardPage() {
  const { user } = useAuthStore();

  // Fetch active enrollments
  const { data: enrollData } = useQuery({
    queryKey: ['my-enrollments-dashboard'],
    queryFn: async () => {
      const res = await api.get('/enrollments/my', { params: { status: 'active', limit: '5' } });
      return res.data as { enrollments: Enrollment[]; pagination: { total: number } };
    },
  });

  // Fetch completed count
  const { data: completedData } = useQuery({
    queryKey: ['my-enrollments-completed-count'],
    queryFn: async () => {
      const res = await api.get('/enrollments/my', { params: { status: 'completed', limit: '1' } });
      return res.data as { pagination: { total: number } };
    },
  });

  // Fetch user profile for points/level/streak
  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.user as { points: number; level: string; streak_days: number };
    },
  });

  const activeEnrollments = enrollData?.enrollments || [];
  const activeCount = enrollData?.pagination?.total || 0;
  const completedCount = completedData?.pagination?.total || 0;
  const points = profileData?.points || 0;
  const level = profileData?.level || 'Novice';
  const streak = profileData?.streak_days || 0;

  const stats = [
    { label: 'Enrolled Courses', value: String(activeCount), icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: String(completedCount), icon: Award, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Points', value: String(points), icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { label: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Learner'}!
        </h1>
        <p className="text-slate-500 mt-1">
          Level: <span className="font-medium text-teal-600">{level}</span> · {points} points
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/50 transition-all text-center group"
            >
              <action.icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Continue Learning */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Continue Learning</h2>
          <Link href="/learner/my-learning" className="text-sm text-teal-600 hover:text-teal-500 font-medium flex items-center gap-1">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeEnrollments.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500 mb-3">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              href="/learner/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeEnrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              const lead = course.course_instructors?.[0]?.profile;
              const progress = Number(enrollment.progress) || 0;

              return (
                <Link
                  key={enrollment.id}
                  href={`/learner/courses/${course.slug}/learn`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{course.title}</p>
                    {lead && (
                      <p className="text-xs text-slate-500">By {lead.first_name} {lead.last_name}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <PlayCircle className="h-5 w-5 text-teal-600 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
