'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, BookOpen, Users, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

const STATUS_TABS = ['all', 'draft', 'published', 'archived'] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default function InstructorCoursesPage() {
  const [tab, setTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', tab, debouncedSearch, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '12' };
      if (tab !== 'all') params.status = tab;
      if (debouncedSearch) params.search = debouncedSearch;
      params.sort = 'newest';
      const res = await api.get('/courses', { params });
      return res.data as {
        courses: Array<{
          id: string;
          title: string;
          slug: string;
          status: string;
          difficulty?: string;
          thumbnail_url?: string;
          enrollment_count?: number;
          created_at: string;
        }>;
        pagination: { page: number; limit: number; total: number };
      };
    },
  });

  const courses = data?.courses || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage your courses</p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                tab === t
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 text-sm"
          />
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No courses yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            {debouncedSearch ? 'No courses match your search.' : 'Create your first course to get started.'}
          </p>
          {!debouncedSearch && (
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/instructor/courses/${course.id}/edit`}
              className="block bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="h-36 bg-gradient-to-br from-teal-500 to-teal-700 relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 text-teal-200" />
                  </div>
                )}
                <span
                  className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[course.status] || 'bg-slate-100 text-slate-600'}`}
                >
                  {course.status}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
                  {course.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {course.difficulty && (
                    <span className="capitalize">{course.difficulty}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.enrollment_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(course.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
