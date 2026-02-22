'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
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
  LineChart,
  Line,
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

const PIE_COLORS = ['#0d9488', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.stats as AdminStats;
    },
  });

  const roleData = data?.users_by_role
    ? Object.entries(data.users_by_role).map(([name, value]) => ({ name, value }))
    : [];

  // Compute cumulative enrollments for line chart
  const cumulativeData = data?.enrollments_trend
    ? data.enrollments_trend.reduce<Array<{ date: string; count: number; cumulative: number }>>(
        (acc, item) => {
          const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
          acc.push({ ...item, cumulative: prev + item.count });
          return acc;
        },
        [],
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-slate-400 text-center py-12">Failed to load analytics.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Comprehensive platform performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: data.total_users.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Courses', value: data.total_courses.toLocaleString(), icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Enrollments', value: data.total_enrollments.toLocaleString(), icon: GraduationCap, color: 'bg-amber-50 text-amber-600' },
          { label: 'Active Users (7d)', value: data.active_users.toLocaleString(), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => (
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Enrollments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Daily Enrollments (30 days)</h2>
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
            <p className="text-sm text-slate-400 text-center py-8">No data yet.</p>
          )}
        </div>

        {/* Cumulative Growth */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cumulative Enrollment Growth</h2>
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No data yet.</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Users by Role</h2>
          {roleData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={false}>
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

        {/* Popular Courses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Popular Courses</h2>
          {data.popular_courses.length > 0 ? (
            <div className="space-y-3">
              {data.popular_courses.map((course, idx) => (
                <div key={course.course_id} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-400 w-6">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{course.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${Math.min(100, (course.enrollments / (data.popular_courses[0]?.enrollments || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-teal-600 w-12 text-right">{course.enrollments}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No course data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
