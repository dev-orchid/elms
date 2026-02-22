'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Archive, Trash2, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  difficulty: string;
  thumbnail_url: string | null;
  created_at: string;
  is_deleted: boolean;
}

interface CoursesResponse {
  courses: Course[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-amber-100 text-amber-700',
};

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-all-courses', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/courses?${params}`);
      return res.data as CoursesResponse;
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => { await api.post(`/courses/${id}/archive`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-courses'] });
      toast.success('Course archived');
    },
    onError: () => toast.error('Failed to archive course'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/courses/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-courses'] });
      toast.success('Course deleted');
    },
    onError: () => toast.error('Failed to delete course'),
  });

  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Courses</h1>
        <p className="text-slate-500 mt-1">Manage all courses on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.courses.length ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No courses found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Difficulty</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((course) => (
                  <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{course.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[course.status] || 'bg-slate-100 text-slate-600'}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{course.difficulty || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(course.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/learner/courses/${course.slug}`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {course.status === 'published' && (
                          <button
                            onClick={() => archiveMutation.mutate(course.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm('Delete this course?')) deleteMutation.mutate(course.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} courses)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
