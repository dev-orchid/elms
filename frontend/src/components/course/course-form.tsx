'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';

const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_hours: z.number().min(0).optional(),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_certification_enabled: z.boolean().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  max_enrollments: z.number().int().min(0).optional(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  defaultValues?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CourseForm({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Save' }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: undefined,
      estimated_hours: undefined,
      thumbnail_url: '',
      is_certification_enabled: false,
      passing_score: 70,
      max_enrollments: undefined,
      ...defaultValues,
    },
  });

  const processSubmit = async (data: CourseFormData) => {
    // Clean up empty strings to undefined
    const cleaned = {
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
      description: data.description || undefined,
    };
    await onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Course Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
          placeholder="e.g. Introduction to Machine Learning"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
          placeholder="Describe what students will learn..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      {/* Difficulty + Estimated Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            {...register('difficulty')}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white"
          >
            <option value="">Select difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          {errors.difficulty && <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>}
        </div>

        <div>
          <label htmlFor="estimated_hours" className="block text-sm font-medium text-slate-700 mb-1">
            Estimated Hours
          </label>
          <input
            id="estimated_hours"
            type="number"
            step="0.5"
            min="0"
            {...register('estimated_hours', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
            placeholder="e.g. 10"
          />
          {errors.estimated_hours && <p className="mt-1 text-sm text-red-600">{errors.estimated_hours.message}</p>}
        </div>
      </div>

      {/* Thumbnail URL */}
      <div>
        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-slate-700 mb-1">
          Thumbnail URL
        </label>
        <input
          id="thumbnail_url"
          type="text"
          {...register('thumbnail_url')}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
          placeholder="https://example.com/image.jpg"
        />
        {errors.thumbnail_url && <p className="mt-1 text-sm text-red-600">{errors.thumbnail_url.message}</p>}
      </div>

      {/* Certification + Passing Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 pt-6">
          <input
            id="is_certification_enabled"
            type="checkbox"
            {...register('is_certification_enabled')}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="is_certification_enabled" className="text-sm font-medium text-slate-700">
            Enable Certification
          </label>
        </div>

        <div>
          <label htmlFor="passing_score" className="block text-sm font-medium text-slate-700 mb-1">
            Passing Score (%)
          </label>
          <input
            id="passing_score"
            type="number"
            min="0"
            max="100"
            {...register('passing_score', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
            placeholder="70"
          />
          {errors.passing_score && <p className="mt-1 text-sm text-red-600">{errors.passing_score.message}</p>}
        </div>
      </div>

      {/* Max Enrollments */}
      <div>
        <label htmlFor="max_enrollments" className="block text-sm font-medium text-slate-700 mb-1">
          Max Enrollments
        </label>
        <input
          id="max_enrollments"
          type="number"
          min="0"
          {...register('max_enrollments', { valueAsNumber: true })}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
          placeholder="Leave empty for unlimited"
        />
        {errors.max_enrollments && <p className="mt-1 text-sm text-red-600">{errors.max_enrollments.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
