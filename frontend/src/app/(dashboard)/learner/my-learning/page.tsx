'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_TABS = ['active', 'completed', 'dropped'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-teal-100 text-teal-800',
  completed: 'bg-emerald-100 text-emerald-800',
  dropped: 'bg-slate-100 text-slate-600',
};

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  completed_at?: string;
  updated_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    thumbnail_url?: string;
    difficulty: string;
    estimated_hours?: number;
    course_instructors?: Array<{
      profile: { id: string; first_name: string; last_name: string };
    }>;
  };
}

export default function MyLearningPage() {
  const [tab, setTab] = useState<StatusTab>('active');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments', tab, page],
    queryFn: async () => {
      const res = await api.get('/enrollments/my', {
        params: { status: tab, page: String(page), limit: '12' },
      });
      return res.data as {
        enrollments: Enrollment[];
        pagination: { page: number; limit: number; total: number };
      };
    },
  });

  const enrollments = data?.enrollments || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Learning</h1>
        <p className="text-sm text-slate-500 mt-1">Track your enrolled courses and progress</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
              tab === t
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Enrollment cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">
            {tab === 'active' ? 'No active courses' : tab === 'completed' ? 'No completed courses' : 'No dropped courses'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {tab === 'active' ? 'Browse our catalog and enroll in a course to start learning.' : ''}
          </p>
          {tab === 'active' && (
            <Link
              href="/learner/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Browse Courses
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            if (!course) return null;
            const lead = course.course_instructors?.[0]?.profile;
            const progress = Number(enrollment.progress) || 0;

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-teal-500 to-teal-700 shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-8 w-8 text-teal-200" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{course.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${STATUS_BADGE[enrollment.status] || ''}`}>
                          {enrollment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {lead && <span>{lead.first_name} {lead.last_name}</span>}
                        <span className="capitalize">{course.difficulty}</span>
                        {course.estimated_hours != null && course.estimated_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(course.estimated_hours * 60)}
                          </span>
                        )}
                        <span>Updated {timeAgo(enrollment.updated_at)}</span>
                      </div>
                    </div>

                    {/* Progress bar + CTA */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex-1">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              enrollment.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}% complete</p>
                      </div>

                      {enrollment.status === 'active' && (
                        <Link
                          href={`/learner/courses/${course.slug}/learn`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Continue
                        </Link>
                      )}

                      {enrollment.status === 'completed' && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
