'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { CourseForm } from '@/components/course/course-form';

export default function NewCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/courses', data);
      toast.success('Course created!');
      router.push(`/instructor/courses/${res.data.course.id}/edit`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to create course';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/instructor/courses"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Create New Course</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details to create a new course</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <CourseForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Create Course" />
      </div>
    </div>
  );
}
