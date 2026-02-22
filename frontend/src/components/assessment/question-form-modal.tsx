'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { X, Plus, Trash2 } from 'lucide-react';

const questionFormSchema = z.object({
  question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay']),
  question_text: z.string().min(1, 'Question is required'),
  correct_answer: z.string().min(1, 'Correct answer is required'),
  points: z.number().int().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().optional(),
  explanation: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface Option {
  id: string;
  text: string;
}

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData & { options?: Option[] }) => Promise<void>;
  defaultValues?: Partial<QuestionFormData> & { options?: Option[] };
  isEditing?: boolean;
}

export function QuestionFormModal({ isOpen, onClose, onSubmit, defaultValues, isEditing }: QuestionFormModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<Option[]>(
    defaultValues?.options || [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question_type: 'mcq',
      question_text: '',
      correct_answer: '',
      points: 1,
      difficulty: 'beginner',
      category: '',
      explanation: '',
      ...defaultValues,
    },
  });

  const questionType = watch('question_type');

  useEffect(() => {
    if (isOpen) {
      reset({
        question_type: 'mcq',
        question_text: '',
        correct_answer: '',
        points: 1,
        difficulty: 'beginner',
        category: '',
        explanation: '',
        ...defaultValues,
      });
      setOptions(
        defaultValues?.options || [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
        ],
      );
    }
  }, [isOpen, defaultValues, reset]);

  // When type changes to true_false, preset correct_answer
  useEffect(() => {
    if (questionType === 'true_false' && !defaultValues?.correct_answer) {
      setValue('correct_answer', 'true');
    }
  }, [questionType, setValue, defaultValues]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const addOption = () => {
    const id = String.fromCharCode(97 + options.length); // a, b, c, d, e...
    setOptions([...options, { id, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionText = (idx: number, text: string) => {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  const processSubmit = async (data: QuestionFormData) => {
    const payload: QuestionFormData & { options?: Option[] } = { ...data };
    if (data.question_type === 'mcq') {
      payload.options = options;
    }
    await onSubmit(payload);
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
            {isEditing ? 'Edit Question' : 'Add Question'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          {/* Type + Difficulty + Points */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                {...register('question_type')}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900"
              >
                <option value="mcq">MCQ</option>
                <option value="true_false">True/False</option>
                <option value="fill_blank">Fill Blank</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                {...register('difficulty')}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Points</label>
              <input
                type="number"
                min="1"
                {...register('points', { valueAsNumber: true })}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category (optional)</label>
            <input
              type="text"
              {...register('category')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Chapter 1, Arrays"
            />
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Question <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              {...register('question_text')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Enter the question..."
            />
            {errors.question_text && <p className="mt-1 text-xs text-red-600">{errors.question_text.message}</p>}
          </div>

          {/* Type-specific answer fields */}
          {questionType === 'mcq' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Options</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono w-4">{opt.id.toUpperCase()}</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
                    placeholder={`Option ${opt.id.toUpperCase()}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                    className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {options.length < 6 && (
                <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                  <Plus className="h-3 w-3" /> Add option
                </button>
              )}
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Correct Answer (option ID, e.g. &quot;a&quot;)</label>
                <select
                  {...register('correct_answer')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900"
                >
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.id.toUpperCase()} — {opt.text || '(empty)'}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {questionType === 'true_false' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Correct Answer</label>
              <select
                {...register('correct_answer')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-900"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          {(questionType === 'fill_blank' || questionType === 'short_answer' || questionType === 'essay') && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {questionType === 'essay' ? 'Sample/Expected Answer' : 'Correct Answer'}
              </label>
              <input
                type="text"
                {...register('correct_answer')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
                placeholder={questionType === 'essay' ? 'Reference answer for grading...' : 'Exact answer...'}
              />
              {errors.correct_answer && <p className="mt-1 text-xs text-red-600">{errors.correct_answer.message}</p>}
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Explanation (optional)</label>
            <textarea
              rows={2}
              {...register('explanation')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
              placeholder="Why this answer is correct..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg transition-colors">
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
