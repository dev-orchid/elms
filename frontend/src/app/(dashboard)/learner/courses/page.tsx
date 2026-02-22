'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, BookOpen, Users, Clock, Filter } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import api from '@/lib/api';

const DIFFICULTY_OPTIONS = ['all', 'beginner', 'intermediate', 'advanced'] as const;
type Difficulty = typeof DIFFICULTY_OPTIONS[number];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
};

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  difficulty: string;
  estimated_hours?: number;
  course_instructors?: Array<{
    profile: { id: string; first_name: string; last_name: string; avatar_url?: string };
  }>;
}

export default function LearnerCoursesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sort, setSort] = useState<'newest' | 'popular' | 'title'>('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [difficulty, debouncedSearch, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses-catalog', difficulty, debouncedSearch, sort, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '12', sort };
      if (difficulty !== 'all') params.difficulty = difficulty;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/courses', { params });
      return res.data as {
        courses: Course[];
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Browse Courses</h1>
        <p className="text-sm text-slate-500 mt-1">Discover courses and start learning</p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 text-sm"
          />
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  difficulty === d
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'popular' | 'title')}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="title">A-Z</option>
        </select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No courses found</h3>
          <p className="text-sm text-slate-400">
            {debouncedSearch ? 'Try adjusting your search or filters.' : 'Check back soon for new courses.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const lead = course.course_instructors?.find(() => true)?.profile;
            return (
              <Link
                key={course.id}
                href={`/learner/courses/${course.slug}`}
                className="block bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-teal-500 to-teal-700 relative">
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
                    className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[course.difficulty] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {course.difficulty}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {lead && (
                      <span className="text-xs text-slate-400">
                        {lead.first_name} {lead.last_name}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {course.estimated_hours != null && course.estimated_hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(course.estimated_hours * 60)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
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
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
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
