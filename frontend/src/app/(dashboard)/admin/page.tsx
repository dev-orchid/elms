'use client';

import { useAuthStore } from '@/stores/auth-store';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserPlus,
  PlusCircle,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Users',
    value: '2,847',
    change: '+12%',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Active Courses',
    value: '156',
    change: '+8%',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Revenue',
    value: '$48,250',
    change: '+23%',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Completion Rate',
    value: '73%',
    change: '+5%',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
  },
];

const quickActions = [
  { label: 'Add New User', icon: UserPlus, href: '/admin/users', color: 'text-blue-600' },
  { label: 'Create Course', icon: PlusCircle, href: '/admin/courses', color: 'text-emerald-600' },
  { label: 'View Reports', icon: BarChart3, href: '/admin/analytics', color: 'text-amber-600' },
  { label: 'Audit Logs', icon: FileText, href: '/admin/audit-logs', color: 'text-purple-600' },
  { label: 'Manage Roles', icon: Shield, href: '/admin/users', color: 'text-red-600' },
  { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'text-slate-600' },
];

const recentActivity = [
  { text: 'New user registered: Sarah Johnson', time: '5 min ago', type: 'user' },
  { text: 'Course "Advanced React" published', time: '1 hour ago', type: 'course' },
  { text: 'Bulk enrollment: 45 users to "Onboarding"', time: '2 hours ago', type: 'enrollment' },
  { text: 'Certificate template updated', time: '4 hours ago', type: 'system' },
  { text: 'New instructor approved: Mike Chen', time: '6 hours ago', type: 'user' },
];

const upcomingEvents = [
  { title: 'Platform Maintenance', date: 'Feb 25, 2026', time: '2:00 AM' },
  { title: 'New Course Launch: AI Fundamentals', date: 'Feb 28, 2026', time: '10:00 AM' },
  { title: 'Quarterly Review Meeting', date: 'Mar 1, 2026', time: '3:00 PM' },
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Admin'}!
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening across the platform today.</p>
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
            <div className="mt-3 flex items-center text-sm">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {stat.change}
              </span>
              <span className="text-slate-400 ml-2">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/50 transition-all text-center group"
            >
              <action.icon className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
            <a href="/admin/audit-logs" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{item.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Upcoming Events</h2>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-center shrink-0">
                  <p className="text-xs text-slate-500 uppercase">{event.date.split(' ')[0]}</p>
                  <p className="text-xl font-bold text-slate-800">{event.date.split(' ')[1].replace(',', '')}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.date} at {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
