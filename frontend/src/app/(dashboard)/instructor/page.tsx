'use client';

import { useAuthStore } from '@/stores/auth-store';
import {
  BookOpen,
  Users,
  BarChart3,
  MessageSquare,
  PlusCircle,
  HelpCircle,
  FileText,
  Star,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  {
    label: 'My Courses',
    value: '8',
    change: '+1',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Total Students',
    value: '342',
    change: '+28',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Avg. Rating',
    value: '4.7',
    change: '+0.2',
    icon: Star,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Completion Rate',
    value: '81%',
    change: '+3%',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600',
  },
];

const quickActions = [
  { label: 'Create Course', icon: PlusCircle, href: '/instructor/courses/new', color: 'text-blue-600' },
  { label: 'My Courses', icon: BookOpen, href: '/instructor/courses', color: 'text-emerald-600' },
  { label: 'Question Bank', icon: HelpCircle, href: '/instructor/question-bank', color: 'text-amber-600' },
  { label: 'Analytics', icon: BarChart3, href: '/instructor/analytics', color: 'text-purple-600' },
];

const recentSubmissions = [
  { student: 'Alice Wang', course: 'React Fundamentals', assignment: 'Final Project', time: '30 min ago', status: 'pending' },
  { student: 'Bob Miller', course: 'TypeScript Mastery', assignment: 'Quiz 3', time: '2 hours ago', status: 'graded' },
  { student: 'Carol Davis', course: 'React Fundamentals', assignment: 'Module 4 Quiz', time: '5 hours ago', status: 'pending' },
  { student: 'David Lee', course: 'Node.js Basics', assignment: 'Homework 2', time: 'Yesterday', status: 'graded' },
];

const discussions = [
  { student: 'Emily Chen', course: 'React Fundamentals', message: 'Question about useEffect cleanup...', time: '1 hour ago' },
  { student: 'Frank Wilson', course: 'TypeScript Mastery', message: 'Can you explain generics?', time: '3 hours ago' },
  { student: 'Grace Kim', course: 'Node.js Basics', message: 'Getting an error with middleware...', time: 'Yesterday' },
];

export default function InstructorDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Instructor'}!
        </h1>
        <p className="text-slate-500 mt-1">Manage your courses and track student progress.</p>
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
              <span className="text-slate-400 ml-2">this month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Submissions</h2>
            <a href="/instructor/courses" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {recentSubmissions.map((sub, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-sm font-medium">
                  {sub.student.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{sub.student}</p>
                  <p className="text-xs text-slate-500">{sub.assignment} &middot; {sub.course}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sub.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {sub.status}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {sub.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Discussions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Discussions</h2>
          </div>
          <div className="space-y-3">
            {discussions.map((disc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 text-sm font-medium">
                  {disc.student.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{disc.student}</p>
                  <p className="text-xs text-slate-500">{disc.course}</p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{disc.message}</span>
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{disc.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
