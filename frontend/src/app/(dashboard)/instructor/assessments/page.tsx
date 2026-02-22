'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod/v3';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Pencil,
  Filter,
  X,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────

interface Assessment {
  id: string;
  course_id: string;
  title: string;
  type: string;
  description?: string;
  time_limit_minutes?: number | null;
  max_attempts: number;
  passing_score: number;
  is_published: boolean;
  // listAssessments returns: assessment_questions: [{question_id}]
  // getAssessment returns: assessment_questions: [{sort_order, question: {...}}]
  assessment_questions?: AssessmentQuestion[];
}

interface AssessmentQuestion {
  question_id?: string;
  sort_order: number;
  question?: {
    id: string;
    question_text: string;
    question_type: string;
    points: number;
    difficulty: string;
  };
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  difficulty: string;
  category?: string;
}

// ─── Constants ──────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  mid_term: 'Midterm',
  final: 'Final',
  assignment: 'Assignment',
};

const TYPE_COLORS: Record<string, string> = {
  quiz: 'bg-blue-100 text-blue-800',
  mid_term: 'bg-amber-100 text-amber-800',
  final: 'bg-red-100 text-red-800',
  assignment: 'bg-purple-100 text-purple-800',
};

// ─── Form Schema ────────────────────────────────────────

const assessmentFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  type: z.enum(['quiz', 'mid_term', 'final', 'assignment']),
  description: z.string().max(2000).optional(),
  time_limit_minutes: z.union([z.number().int().min(1), z.nan()]).optional().nullable(),
  max_attempts: z.number().int().min(1),
  passing_score: z.number().min(0).max(100),
  is_published: z.boolean(),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

// ─── Main Page ──────────────────────────────────────────

export default function InstructorAssessmentsPage() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing?: Assessment }>({ open: false });
  const [questionPickerFor, setQuestionPickerFor] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [courseId]);

  // ─── Queries ────────────────────────────────────────

  const { data: coursesData } = useQuery({
    queryKey: ['my-courses-for-assessments'],
    queryFn: async () => {
      const res = await api.get('/courses', { params: { limit: '100' } });
      return res.data.courses as Array<{ id: string; title: string }>;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', courseId, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (courseId) params.course_id = courseId;
      const res = await api.get('/assessments', { params });
      return res.data as { assessments: Assessment[]; pagination: { page: number; limit: number; total: number } };
    },
  });

  const assessments = data?.assessments || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  // ─── Mutations ──────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => api.post('/assessments', d),
    onSuccess: () => { toast.success('Assessment created'); queryClient.invalidateQueries({ queryKey: ['assessments'] }); },
    onError: () => toast.error('Failed to create assessment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: { id: string; [k: string]: unknown }) => api.patch(`/assessments/${id}`, d),
    onSuccess: () => { toast.success('Assessment updated'); queryClient.invalidateQueries({ queryKey: ['assessments'] }); },
    onError: () => toast.error('Failed to update assessment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/${id}`),
    onSuccess: () => { toast.success('Assessment deleted'); queryClient.invalidateQueries({ queryKey: ['assessments'] }); },
    onError: () => toast.error('Failed to delete assessment'),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      api.patch(`/assessments/${id}`, { is_published }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_published ? 'Assessment published' : 'Assessment unpublished');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: () => toast.error('Failed to update assessment'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage quizzes, exams, and assignments</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          disabled={!courseId}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Assessment
        </button>
      </div>

      {/* Course filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Courses</option>
          {(coursesData || []).map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Filter className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No assessments found</h3>
          <p className="text-sm text-slate-400">
            {!courseId ? 'Select a course first, then create an assessment.' : 'Create your first assessment to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-28">Type</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 w-24">Questions</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 w-24">Status</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-slate-800 font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.type] || 'bg-slate-100 text-slate-600'}`}>
                      {TYPE_LABELS[a.type] || a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    <button
                      onClick={() => setQuestionPickerFor(a.id)}
                      className="text-teal-600 hover:text-teal-700 underline underline-offset-2"
                    >
                      {a.assessment_questions?.length ?? 0}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => togglePublishMutation.mutate({ id: a.id, is_published: !a.is_published })}
                        className="p-1 text-slate-400 hover:text-teal-600"
                        title={a.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {a.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setModal({ open: true, editing: a })}
                        className="p-1 text-slate-400 hover:text-teal-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this assessment?')) deleteMutation.mutate(a.id); }}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal.open && (
        <AssessmentFormModal
          courseId={courseId}
          editing={modal.editing}
          onClose={() => setModal({ open: false })}
          onSubmit={async (data) => {
            if (modal.editing) {
              await updateMutation.mutateAsync({ id: modal.editing.id, ...data });
            } else {
              await createMutation.mutateAsync({ ...data, course_id: courseId });
            }
          }}
        />
      )}

      {/* Question Picker Modal */}
      {questionPickerFor && (
        <QuestionPickerModal
          assessmentId={questionPickerFor}
          courseId={assessments.find((a) => a.id === questionPickerFor)?.course_id || courseId}
          onClose={() => {
            setQuestionPickerFor(null);
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
          }}
        />
      )}
    </div>
  );
}

// ─── Assessment Form Modal ──────────────────────────────

function AssessmentFormModal({
  courseId,
  editing,
  onClose,
  onSubmit,
}: {
  courseId: string;
  editing?: Assessment;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: editing
      ? {
          title: editing.title,
          type: editing.type as AssessmentFormValues['type'],
          description: editing.description || '',
          time_limit_minutes: editing.time_limit_minutes ?? undefined,
          max_attempts: editing.max_attempts,
          passing_score: editing.passing_score,
          is_published: editing.is_published,
        }
      : {
          title: '',
          type: 'quiz',
          description: '',
          max_attempts: 1,
          passing_score: 50,
          is_published: false,
        },
  });

  const onFormSubmit = async (data: AssessmentFormValues) => {
    const payload: Record<string, unknown> = { ...data };
    // Clean up NaN time limit
    if (!payload.time_limit_minutes || Number.isNaN(payload.time_limit_minutes)) {
      payload.time_limit_minutes = null;
    }
    await onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {editing ? 'Edit Assessment' : 'Create Assessment'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              {...register('title')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              placeholder="e.g. Chapter 1 Quiz"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="quiz">Quiz</option>
              <option value="mid_term">Midterm Exam</option>
              <option value="final">Final Exam</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Row: Time Limit, Max Attempts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (min)</label>
              <input
                type="number"
                {...register('time_limit_minutes', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                placeholder="No limit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
              <input
                type="number"
                {...register('max_attempts', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                min={1}
              />
              {errors.max_attempts && <p className="text-xs text-red-500 mt-1">{errors.max_attempts.message}</p>}
            </div>
          </div>

          {/* Passing Score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
            <input
              type="number"
              {...register('passing_score', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              min={0}
              max={100}
            />
            {errors.passing_score && <p className="text-xs text-red-500 mt-1">{errors.passing_score.message}</p>}
          </div>

          {/* Published toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_published')}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">Publish immediately</span>
          </label>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Question Picker Modal ──────────────────────────────

function QuestionPickerModal({
  assessmentId,
  courseId,
  onClose,
}: {
  assessmentId: string;
  courseId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  // Fetch assessment details (with linked questions)
  const { data: assessmentData, isLoading: loadingAssessment } = useQuery({
    queryKey: ['assessment-detail', assessmentId],
    queryFn: async () => {
      const res = await api.get(`/assessments/${assessmentId}`);
      return res.data.assessment as Assessment;
    },
  });

  // Fetch all available questions for the course
  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions-for-picker', courseId],
    queryFn: async () => {
      const res = await api.get('/questions', { params: { course_id: courseId, limit: '200' } });
      return res.data.questions as Question[];
    },
    enabled: !!courseId,
    staleTime: 0,
  });

  const linkedQuestionIds = new Set(
    (assessmentData?.assessment_questions || []).map((aq) => aq.question_id || aq.question?.id).filter(Boolean),
  );

  const addQuestionsMutation = useMutation({
    mutationFn: (questionIds: string[]) =>
      api.post(`/assessments/${assessmentId}/questions`, { question_ids: questionIds }),
    onSuccess: () => {
      toast.success('Questions added');
      queryClient.invalidateQueries({ queryKey: ['assessment-detail', assessmentId] });
    },
    onError: () => toast.error('Failed to add questions'),
  });

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      api.delete(`/assessments/${assessmentId}/questions/${questionId}`),
    onSuccess: () => {
      toast.success('Question removed');
      queryClient.invalidateQueries({ queryKey: ['assessment-detail', assessmentId] });
    },
    onError: () => toast.error('Failed to remove question'),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const availableQuestions = (questionsData || []).filter((q) => !linkedQuestionIds.has(q.id));
  const linkedQuestions = assessmentData?.assessment_questions || [];

  const isLoading = loadingAssessment || loadingQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">
            Manage Questions — {assessmentData?.title || '...'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Currently linked questions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Linked Questions ({linkedQuestions.length})
                </h3>
                {linkedQuestions.length === 0 ? (
                  <p className="text-sm text-slate-400">No questions added yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {linkedQuestions.map((aq, idx) => {
                      const qId = aq.question_id || aq.question?.id || '';
                      return (
                        <div key={qId || idx} className="flex items-center gap-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                          <Check className="h-4 w-4 text-teal-600 shrink-0" />
                          <span className="text-sm text-slate-700 flex-1 line-clamp-1">
                            {aq.question?.question_text || qId}
                          </span>
                          <span className="text-xs text-slate-400">
                            {aq.question?.points || 0} pts
                          </span>
                          <button
                            onClick={() => removeQuestionMutation.mutate(qId)}
                            className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Available questions to add */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Available Questions ({availableQuestions.length})
                  </h3>
                  {selected.size > 0 && (
                    <button
                      onClick={() => {
                        addQuestionsMutation.mutate(Array.from(selected));
                        setSelected(new Set());
                      }}
                      disabled={addQuestionsMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Selected ({selected.size})
                    </button>
                  )}
                </div>
                {availableQuestions.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {(questionsData || []).length === 0
                      ? 'No questions in the question bank for this course.'
                      : 'All questions have been added.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {availableQuestions.map((q) => (
                      <label
                        key={q.id}
                        className={`flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                          selected.has(q.id) ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggleSelect(q.id)}
                          className="rounded border-slate-300 text-teal-600"
                        />
                        <span className="text-sm text-slate-700 flex-1 line-clamp-1">{q.question_text}</span>
                        <span className="text-xs text-slate-400 shrink-0">{q.points} pts</span>
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize shrink-0">
                          {q.difficulty}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
