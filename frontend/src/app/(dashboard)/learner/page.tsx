'use client';

import { useAuthStore } from '@/stores/auth-store';
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  PlayCircle,
  Trophy,
  Target,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  {
    label: 'Enrolled Courses',
    value: '12',
    change: '+2',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Completed',
    value: '8',
    change: '+1',
    icon: Award,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Hours Learned',
    value: '47',
    change: '+6h',
    icon: Clock,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Current Streak',
    value: '5 days',
    change: '+2',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
  },
];

const quickActions = [
  { label: 'Browse Courses', icon: BookOpen, href: '/learner/courses', color: 'text-blue-600' },
  { label: 'Continue Learning', icon: PlayCircle, href: '/learner/my-learning', color: 'text-emerald-600' },
  { label: 'Certificates', icon: Award, href: '/learner/certificates', color: 'text-amber-600' },
  { label: 'Leaderboard', icon: Trophy, href: '/learner/leaderboard', color: 'text-purple-600' },
];

const inProgressCourses = [
  { title: 'Introduction to TypeScript', progress: 75, instructor: 'Dr. Smith', lastAccessed: '2 hours ago' },
  { title: 'React Fundamentals', progress: 45, instructor: 'Jane Cooper', lastAccessed: 'Yesterday' },
  { title: 'Node.js Best Practices', progress: 20, instructor: 'Mike Johnson', lastAccessed: '3 days ago' },
];

const achievements = [
  { title: 'Fast Learner', desc: 'Complete 5 courses', icon: Target, earned: true },
  { title: 'Streak Master', desc: '7-day streak', icon: TrendingUp, earned: false },
  { title: 'Top Performer', desc: 'Score 90%+ on 3 assessments', icon: BarChart3, earned: true },
];

export default function LearnerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.first_name || 'Learner'}!
        </h1>
        <p className="text-slate-500 mt-1">Track your progress and continue learning.</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* In-progress courses */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Continue Learning</h2>
            <a href="/learner/my-learning" className="text-sm text-teal-600 hover:text-teal-500 font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {inProgressCourses.map((course) => (
              <div key={course.title} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{course.title}</p>
                  <p className="text-xs text-slate-500">By {course.instructor} &middot; {course.lastAccessed}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{course.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Achievements</h2>
          <div className="space-y-3">
            {achievements.map((badge) => (
              <div
                key={badge.title}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  badge.earned
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  badge.earned ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'
                }`}>
                  <badge.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{badge.title}</p>
                  <p className="text-xs text-slate-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
