'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { X, Upload } from 'lucide-react';
import api from '@/lib/api';

const lessonFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  content_type: z.enum(['video', 'document', 'text', 'quiz', 'assignment']).optional(),
  content_url: z.string().optional(),
  content_body: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

type LessonFormData = z.infer<typeof lessonFormSchema>;

interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormData) => Promise<void>;
  defaultValues?: Partial<LessonFormData>;
  isEditing?: boolean;
}

export function LessonFormModal({ isOpen, onClose, onSubmit, defaultValues, isEditing }: LessonFormModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content_type: undefined,
      content_url: '',
      content_body: '',
      duration_minutes: undefined,
      ...defaultValues,
    },
  });

  const contentType = watch('content_type');

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        content_type: undefined,
        content_url: '',
        content_body: '',
        duration_minutes: undefined,
        ...defaultValues,
      });
    }
  }, [isOpen, defaultValues, reset]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('content_url', res.data.url);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setUploading(false);
    }
  };

  const processSubmit = async (data: LessonFormData) => {
    const cleaned = {
      ...data,
      content_url: data.content_url || undefined,
      content_body: data.content_body || undefined,
      description: data.description || undefined,
    };
    await onSubmit(cleaned);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEditing ? 'Edit Lesson' : 'Add Lesson'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="lesson-title" className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-title"
              type="text"
              {...register('title')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Introduction Video"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="lesson-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="lesson-desc"
              rows={2}
              {...register('description')}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Brief description..."
            />
          </div>

          {/* Content Type + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="content_type" className="block text-sm font-medium text-slate-700 mb-1">
                Content Type
              </label>
              <select
                id="content_type"
                {...register('content_type')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
              >
                <option value="">Select type</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="text">Text</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">
                Duration (min)
              </label>
              <input
                id="duration"
                type="number"
                min="0"
                {...register('duration_minutes', { valueAsNumber: true })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                placeholder="e.g. 15"
              />
            </div>
          </div>

          {/* Content URL or Body depending on type */}
          {contentType === 'text' ? (
            <div>
              <label htmlFor="content_body" className="block text-sm font-medium text-slate-700 mb-1">
                Content Body
              </label>
              <textarea
                id="content_body"
                rows={6}
                {...register('content_body')}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 resize-none font-mono text-sm"
                placeholder="Enter lesson content (supports Markdown)..."
              />
            </div>
          ) : (
            <div>
              <label htmlFor="content_url" className="block text-sm font-medium text-slate-700 mb-1">
                Content URL
              </label>
              <div className="flex gap-2">
                <input
                  id="content_url"
                  type="text"
                  {...register('content_url')}
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                  placeholder="https://..."
                />
                <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors text-sm font-medium shrink-0">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.mp4,.webm,.pptx,.docx,.png,.jpg,.jpeg,.gif"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
