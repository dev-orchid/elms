'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Pencil, Trash2, X, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface BundleCourse {
  course_id: string;
  sort_order: number;
  course: { id: string; title: string; slug: string; thumbnail_url: string | null; status: string } | null;
}

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_sequential: boolean;
  created_at: string;
  bundle_courses: BundleCourse[];
}

interface BundlesResponse {
  bundles: Bundle[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

export default function BundlesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [managingCourses, setManagingCourses] = useState<Bundle | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bundles', page],
    queryFn: async () => {
      const res = await api.get(`/admin/bundles?page=${page}&limit=20`);
      return res.data as BundlesResponse;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/bundles/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bundles'] });
      toast.success('Bundle deleted');
    },
    onError: () => toast.error('Failed to delete bundle'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Course Bundles</h1>
          <p className="text-slate-500 mt-1">Group courses into learning paths.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Create Bundle
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.bundles.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No bundles yet. Create your first bundle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.bundles.map((bundle) => (
            <div key={bundle.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{bundle.title}</h3>
                  {bundle.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{bundle.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(bundle); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this bundle?')) deleteMutation.mutate(bundle.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span>{bundle.bundle_courses.length} courses</span>
                {bundle.is_sequential && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Sequential</span>
                )}
              </div>
              {bundle.bundle_courses.length > 0 && (
                <div className="space-y-1 mb-3">
                  {bundle.bundle_courses
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .slice(0, 3)
                    .map((bc) => (
                      <p key={bc.course_id} className="text-xs text-slate-600 truncate">
                        {bc.sort_order + 1}. {bc.course?.title || 'Unknown course'}
                      </p>
                    ))}
                  {bundle.bundle_courses.length > 3 && (
                    <p className="text-xs text-slate-400">+{bundle.bundle_courses.length - 3} more</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setManagingCourses(bundle)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Manage Courses
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bundle Form Modal */}
      {showForm && (
        <BundleFormModal
          bundle={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['admin-bundles'] });
          }}
        />
      )}

      {/* Manage Courses Modal */}
      {managingCourses && (
        <ManageCoursesModal
          bundle={managingCourses}
          onClose={() => setManagingCourses(null)}
          onSaved={() => {
            setManagingCourses(null);
            qc.invalidateQueries({ queryKey: ['admin-bundles'] });
          }}
        />
      )}
    </div>
  );
}

/* ─── Bundle Form Modal ────────────────────────────────── */

function BundleFormModal({ bundle, onClose, onSaved }: { bundle: Bundle | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(bundle?.title || '');
  const [description, setDescription] = useState(bundle?.description || '');
  const [isSequential, setIsSequential] = useState(bundle?.is_sequential || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (bundle) {
        await api.patch(`/admin/bundles/${bundle.id}`, { title, description, is_sequential: isSequential });
        toast.success('Bundle updated');
      } else {
        await api.post('/admin/bundles', { title, description, is_sequential: isSequential });
        toast.success('Bundle created');
      }
      onSaved();
    } catch {
      toast.error('Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{bundle ? 'Edit' : 'Create'} Bundle</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSequential}
              onChange={(e) => setIsSequential(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">Sequential (must complete courses in order)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50">
              {saving ? 'Saving...' : bundle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Manage Courses Modal ─────────────────────────────── */

function ManageCoursesModal({ bundle, onClose, onSaved }: { bundle: Bundle; onClose: () => void; onSaved: () => void }) {
  const [courses, setCourses] = useState<Array<{ course_id: string; sort_order: number; title: string }>>(
    bundle.bundle_courses
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((bc) => ({ course_id: bc.course_id, sort_order: bc.sort_order, title: bc.course?.title || 'Unknown' })),
  );
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allCourses } = useQuery({
    queryKey: ['all-courses-for-bundle'],
    queryFn: async () => {
      const res = await api.get('/courses?limit=200&status=published');
      return (res.data.courses || []) as CourseOption[];
    },
  });

  const availableCourses = (allCourses || []).filter(
    (c) => !courses.some((bc) => bc.course_id === c.id) && c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addCourse = (c: CourseOption) => {
    setCourses((prev) => [...prev, { course_id: c.id, sort_order: prev.length, title: c.title }]);
  };

  const removeCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.course_id !== courseId).map((c, i) => ({ ...c, sort_order: i })));
  };

  const moveCourse = (idx: number, dir: -1 | 1) => {
    setCourses((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((c, i) => ({ ...c, sort_order: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/bundles/${bundle.id}/courses`, {
        courses: courses.map((c) => ({ course_id: c.course_id, sort_order: c.sort_order })),
      });
      toast.success('Bundle courses updated');
      onSaved();
    } catch {
      toast.error('Failed to update courses');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Manage Courses — {bundle.title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Current courses */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Current Courses ({courses.length})</h3>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No courses in this bundle.</p>
          ) : (
            <div className="space-y-1">
              {courses.map((c, idx) => (
                <div key={c.course_id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveCourse(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                      <GripVertical className="h-3 w-3 rotate-180" />
                    </button>
                    <button onClick={() => moveCourse(idx, 1)} disabled={idx === courses.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-5">{idx + 1}.</span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{c.title}</span>
                  <button onClick={() => removeCourse(c.course_id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add courses */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Add Courses</h3>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {availableCourses.slice(0, 20).map((c) => (
              <button
                key={c.id}
                onClick={() => addCourse(c)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-teal-50 text-left text-sm text-slate-700"
              >
                <Plus className="h-3.5 w-3.5 text-teal-500" />
                {c.title}
              </button>
            ))}
            {availableCourses.length === 0 && (
              <p className="text-sm text-slate-400 py-2 text-center">No more courses available.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
