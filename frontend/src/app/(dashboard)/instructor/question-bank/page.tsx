'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react';
import api from '@/lib/api';
import { QuestionFormModal } from '@/components/assessment/question-form-modal';

interface Question {
  id: string;
  course_id: string;
  category?: string;
  question_type: string;
  question_text: string;
  options?: { id: string; text: string }[];
  correct_answer: string;
  points: number;
  difficulty: string;
  explanation?: string;
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  true_false: 'True/False',
  fill_blank: 'Fill Blank',
  short_answer: 'Short Answer',
  essay: 'Essay',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
};

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [courseId, setCourseId] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing?: Question }>({ open: false });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, difficultyFilter]);

  const { data: coursesData } = useQuery({
    queryKey: ['my-courses-for-questions'],
    queryFn: async () => {
      const res = await api.get('/courses', { params: { limit: '100' } });
      return res.data.courses as Array<{ id: string; title: string }>;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['questions', courseId, debouncedSearch, typeFilter, difficultyFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (courseId) params.course_id = courseId;
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.question_type = typeFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      const res = await api.get('/questions', { params });
      return res.data as { questions: Question[]; pagination: { page: number; limit: number; total: number } };
    },
  });

  const questions = data?.questions || [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => api.post('/questions', d),
    onSuccess: () => { toast.success('Question created'); queryClient.invalidateQueries({ queryKey: ['questions'] }); },
    onError: () => toast.error('Failed to create question'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: { id: string; [k: string]: unknown }) => api.patch(`/questions/${id}`, d),
    onSuccess: () => { toast.success('Question updated'); queryClient.invalidateQueries({ queryKey: ['questions'] }); },
    onError: () => toast.error('Failed to update question'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => { toast.success('Question deleted'); queryClient.invalidateQueries({ queryKey: ['questions'] }); },
    onError: () => toast.error('Failed to delete question'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/questions/bulk-delete', { ids }),
    onSuccess: () => { toast.success('Questions deleted'); setSelected(new Set()); queryClient.invalidateQueries({ queryKey: ['questions'] }); },
    onError: () => toast.error('Failed to delete questions'),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAll = () => {
    setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((q) => q.id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-1">Manage questions for assessments</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          disabled={!courseId}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Courses</option>
          {(coursesData || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="fill_blank">Fill Blank</option>
          <option value="short_answer">Short Answer</option>
          <option value="essay">Essay</option>
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        {selected.size > 0 && (
          <button onClick={() => { if (confirm(`Delete ${selected.size} question(s)?`)) bulkDeleteMutation.mutate(Array.from(selected)); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" /> Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Filter className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No questions found</h3>
          <p className="text-sm text-slate-400">{!courseId ? 'Select a course first, then add questions.' : 'Add your first question to get started.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.size === questions.length && questions.length > 0} onChange={toggleAll} className="rounded border-slate-300 text-teal-600" /></th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Question</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-24">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-28">Difficulty</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600 w-16">Pts</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} className="rounded border-slate-300 text-teal-600" /></td>
                  <td className="px-4 py-3"><p className="text-slate-800 line-clamp-2">{q.question_text}</p>{q.category && <span className="text-xs text-slate-400">{q.category}</span>}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{TYPE_LABELS[q.question_type] || q.question_type}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[q.difficulty] || ''}`}>{q.difficulty}</span></td>
                  <td className="px-4 py-3 text-center text-slate-600">{q.points}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setModal({ open: true, editing: q })} className="p-1 text-slate-400 hover:text-teal-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(q.id); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Next</button>
        </div>
      )}

      <QuestionFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        onSubmit={async (data) => {
          if (modal.editing) {
            await updateMutation.mutateAsync({ id: modal.editing.id, ...data });
          } else {
            await createMutation.mutateAsync({ ...data, course_id: courseId });
          }
        }}
        defaultValues={modal.editing ? {
          question_type: modal.editing.question_type as 'mcq',
          question_text: modal.editing.question_text,
          correct_answer: modal.editing.correct_answer,
          points: modal.editing.points,
          difficulty: modal.editing.difficulty as 'beginner',
          category: modal.editing.category || '',
          explanation: modal.editing.explanation || '',
          options: modal.editing.options,
        } : undefined}
        isEditing={!!modal.editing}
      />
    </div>
  );
}
