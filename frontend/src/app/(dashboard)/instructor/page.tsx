'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import {
  BookOpen,
  Users,
  BarChart3,
  PlusCircle,
  HelpCircle,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';

interface InstructorStats {
  total_courses: number;
  total_students: number;
  pending_grading: number;
  average_score: number;
  enrollment_trend: Array<{ date: string; count: number }>;
  course_stats: Array<{ course_id: string; title: string; students: number; avg_progress: number }>;
}

const quickActions = [
  { label: 'Create Course', icon: PlusCircle, href: '/instructor/courses/new', color: 'text-blue-600' },
  { label: 'My Courses', icon: BookOpen, href: '/instructor/courses', color: 'text-emerald-600' },
  { label: 'Question Bank', icon: HelpCircle, href: '/instructor/question-bank', color: 'text-amber-600' },
  { label: 'Analytics', icon: BarChart3, href: '/instructor/analytics', color: 'text-purple-600' },
];

export default function InstructorDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/instructor/stats');
      return res.data.stats as InstructorStats;
    },
  });

  const stats = data
    ? [
        { label: 'My Courses', value: (data.total_courses ?? 0).toString(), icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Students', value: (data.total_students ?? 0).toLocaleString(), icon: Users, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Pending Grading', value: (data.pending_grading ?? 0).toString(), icon: ClipboardCheck, color: 'bg-amber-50 text-amber-600' },
        { label: 'Avg. Score', value: `${data.average_score ?? 0}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
      ]
    : [];

  const courseStats = data?.course_stats || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Instructor'}!
        </h1>
        <p className="text-slate-500 mt-1">Manage your courses and track student progress.</p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
      )}

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

      {/* Course Stats */}
      {data && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">My Courses</h2>
            <Link href="/instructor/courses" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
              View all
            </Link>
          </div>
          {courseStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No courses yet. Create your first course!</p>
          ) : (
            <div className="space-y-3">
              {courseStats.slice(0, 6).map((course) => (
                <div key={course.course_id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.students} students</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${course.avg_progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-600 w-8 text-right">{course.avg_progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
