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
    const cleaned = {
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
      description: data.description || undefined,
    };
    await onSubmit(cleaned);
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 transition-all';

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-8">
      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column — Core Info */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Course Information</h3>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={inputClass}
              placeholder="e.g. Introduction to Machine Learning"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              {...register('description')}
              className={`${inputClass} resize-none`}
              placeholder="Describe what students will learn..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-1.5">
                Difficulty
              </label>
              <select
                id="difficulty"
                {...register('difficulty')}
                className={`${inputClass} bg-white`}
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {errors.difficulty && <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>}
            </div>

            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-slate-700 mb-1.5">
                Estimated Hours
              </label>
              <input
                id="estimated_hours"
                type="number"
                step="0.5"
                min="0"
                {...register('estimated_hours', { valueAsNumber: true })}
                className={inputClass}
                placeholder="e.g. 10"
              />
              {errors.estimated_hours && <p className="mt-1 text-sm text-red-600">{errors.estimated_hours.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="thumbnail_url" className="block text-sm font-medium text-slate-700 mb-1.5">
              Thumbnail URL
            </label>
            <input
              id="thumbnail_url"
              type="text"
              {...register('thumbnail_url')}
              className={inputClass}
              placeholder="https://example.com/image.jpg"
            />
            {errors.thumbnail_url && <p className="mt-1 text-sm text-red-600">{errors.thumbnail_url.message}</p>}
          </div>
        </div>

        {/* Right Column — Settings */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Settings</h3>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-5">
            <div className="flex items-start gap-3">
              <input
                id="is_certification_enabled"
                type="checkbox"
                {...register('is_certification_enabled')}
                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <label htmlFor="is_certification_enabled" className="text-sm font-medium text-slate-700">
                  Enable Certification
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issue certificates when learners complete this course
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="passing_score" className="block text-sm font-medium text-slate-700 mb-1.5">
                Passing Score (%)
              </label>
              <input
                id="passing_score"
                type="number"
                min="0"
                max="100"
                {...register('passing_score', { valueAsNumber: true })}
                className={`${inputClass} bg-white`}
                placeholder="70"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum score required to pass this course</p>
              {errors.passing_score && <p className="mt-1 text-sm text-red-600">{errors.passing_score.message}</p>}
            </div>

            <div>
              <label htmlFor="max_enrollments" className="block text-sm font-medium text-slate-700 mb-1.5">
                Max Enrollments
              </label>
              <input
                id="max_enrollments"
                type="number"
                min="0"
                {...register('max_enrollments', { valueAsNumber: true })}
                className={`${inputClass} bg-white`}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum number of students that can enroll</p>
              {errors.max_enrollments && <p className="mt-1 text-sm text-red-600">{errors.max_enrollments.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end border-t border-slate-100 pt-5">
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
