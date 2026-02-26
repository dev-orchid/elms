'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  UserPlus,
  PlusCircle,
  BarChart3,
  FileText,
  Shield,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/lib/api';

interface AdminStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_users: number;
  users_by_role: Record<string, number>;
  enrollments_trend: Array<{ date: string; count: number }>;
  popular_courses: Array<{ course_id: string; title: string; enrollments: number }>;
}

const ROLE_COLORS: Record<string, string> = {
  learner: '#0d9488',
  instructor: '#8b5cf6',
  admin: '#f59e0b',
  partner: '#0ea5e9',
};

const PIE_COLORS = ['#0d9488', '#8b5cf6', '#f59e0b', '#0ea5e9'];

const quickActions = [
  { label: 'Manage Users', icon: UserPlus, href: '/admin/users', color: 'text-blue-600' },
  { label: 'All Courses', icon: PlusCircle, href: '/admin/courses', color: 'text-emerald-600' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'text-amber-600' },
  { label: 'Audit Logs', icon: FileText, href: '/admin/audit-logs', color: 'text-purple-600' },
  { label: 'Bundles', icon: Package, href: '/admin/bundles', color: 'text-teal-600' },
  { label: 'Roles', icon: Shield, href: '/admin/users', color: 'text-red-600' },
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.stats as AdminStats;
    },
  });

  const stats = data
    ? [
        { label: 'Total Users', value: data.total_users.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Courses', value: data.total_courses.toLocaleString(), icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Enrollments', value: data.total_enrollments.toLocaleString(), icon: GraduationCap, color: 'bg-amber-50 text-amber-600' },
        { label: 'Active Users (7d)', value: data.active_users.toLocaleString(), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
      ]
    : [];

  const roleData = data?.users_by_role
    ? Object.entries(data.users_by_role).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Admin'}!
        </h1>
        <p className="text-slate-500 mt-1">Platform overview and management.</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

      {/* Charts row */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Enrollment Trend (30 days)</h2>
            {data.enrollments_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.enrollments_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No enrollment data yet.</p>
            )}
          </div>

          {/* Role Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Users by Role</h2>
            {roleData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                    >
                      {roleData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {roleData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-sm text-slate-600 capitalize">{entry.name.replace('_', ' ')}</span>
                      <span className="text-sm font-semibold text-slate-800">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No user data yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Popular Courses */}
      {data && data.popular_courses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Popular Courses</h2>
          <div className="space-y-2">
            {data.popular_courses.map((course, idx) => (
              <div key={course.course_id} className="flex items-center gap-3 py-2">
                <span className="text-sm font-mono text-slate-400 w-6">{idx + 1}.</span>
                <span className="text-sm text-slate-800 flex-1">{course.title}</span>
                <span className="text-sm font-semibold text-teal-600">{course.enrollments} enrolled</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
