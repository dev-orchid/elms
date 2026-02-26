'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Settings, BookOpen, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { CourseForm } from '@/components/course/course-form';
import { ModuleTree } from '@/components/course/module-tree';
import { InstructorManager } from '@/components/course/instructor-manager';

type TabId = 'details' | 'content' | 'instructors' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'content', label: 'Content', icon: BookOpen },
  { id: 'instructors', label: 'Instructors', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-600',
};

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}`);
      return res.data.course;
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/publish`),
    onSuccess: () => {
      toast.success('Course published!');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to publish course');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/archive`),
    onSuccess: () => {
      toast.success('Course archived');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: () => toast.error('Failed to archive course'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      toast.success('Course deleted');
      router.push('/instructor/courses');
    },
    onError: () => toast.error('Failed to delete course'),
  });

  const handleUpdateDetails = async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/courses/${courseId}`, formData);
      toast.success('Course updated');
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update course';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Course not found or you don&apos;t have access.</p>
        <Link href="/instructor/courses" className="text-teal-600 hover:text-teal-700 text-sm mt-2 inline-block">
          Back to courses
        </Link>
      </div>
    );
  }

  const course = data;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/courses"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{course.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[course.status] || ''}`}>
                {course.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Edit course details, content, and settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === t.id
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'details' && (
          <CourseForm
            defaultValues={{
              title: course.title,
              description: course.description || '',
              difficulty: course.difficulty,
              estimated_hours: course.estimated_hours,
              thumbnail_url: course.thumbnail_url || '',
              is_certification_enabled: course.is_certification_enabled,
              passing_score: course.passing_score,
              max_enrollments: course.max_enrollments,
            }}
            onSubmit={handleUpdateDetails}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
          />
        )}

        {activeTab === 'content' && (
          <ModuleTree courseId={courseId} modules={course.modules || []} />
        )}

        {activeTab === 'instructors' && (
          <InstructorManager
            courseId={courseId}
            instructors={course.course_instructors || []}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Publishing</h3>
              <div className="flex flex-wrap gap-3">
                {course.status === 'draft' && (
                  <button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors"
                  >
                    {publishMutation.isPending ? 'Publishing...' : 'Publish Course'}
                  </button>
                )}
                {course.status === 'published' && isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm('Archive this course? Students will no longer be able to enroll.')) {
                        archiveMutation.mutate();
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {archiveMutation.isPending ? 'Archiving...' : 'Archive Course'}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-medium text-red-600 uppercase tracking-wide mb-4">Danger Zone</h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Course'}
                </button>
              )}
              {!isAdmin && (
                <p className="text-sm text-slate-500">Only administrators can delete courses.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
