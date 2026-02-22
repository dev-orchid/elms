'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, User } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import api from '@/lib/api';

interface Submission {
  id: string;
  user_id: string;
  attempt_number: number;
  status: string;
  score?: number;
  total_points?: number;
  submitted_at?: string;
  graded_at?: string;
  user: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string };
}

interface SubmissionAnswer {
  id: string;
  question_id: string;
  answer_text?: string;
  selected_options?: unknown;
  is_correct?: boolean;
  points_awarded?: number;
  feedback?: string;
  question: {
    question_text: string;
    question_type: string;
    correct_answer: string;
    options?: unknown;
    points: number;
    explanation?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-800',
  graded: 'bg-emerald-100 text-emerald-800',
};

export default function GradeAssessmentPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const assessmentId = params.id as string;
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>({});

  // Fetch assessment info
  const { data: assessmentData } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      const res = await api.get(`/assessments/${assessmentId}`);
      return res.data.assessment as { title: string; passing_score: number };
    },
  });

  // Fetch submissions
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['assessment-submissions', assessmentId],
    queryFn: async () => {
      const res = await api.get(`/assessments/${assessmentId}/submissions`, { params: { limit: '50' } });
      return res.data as { submissions: Submission[] };
    },
  });

  // Fetch selected submission results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['submission-results', selectedSubmission],
    queryFn: async () => {
      const res = await api.get(`/submissions/${selectedSubmission}/results`);
      return res.data as { submission: Submission; answers: SubmissionAnswer[] };
    },
    enabled: !!selectedSubmission,
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { answers: Array<{ question_id: string; points_awarded: number; feedback?: string }> }) =>
      api.post(`/submissions/${selectedSubmission}/grade`, data),
    onSuccess: () => {
      toast.success('Submission graded');
      queryClient.invalidateQueries({ queryKey: ['assessment-submissions', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission-results', selectedSubmission] });
    },
    onError: () => toast.error('Failed to grade submission'),
  });

  const submissions = subsData?.submissions || [];
  const answers = resultsData?.answers || [];

  const handleGrade = () => {
    const gradeAnswers = answers.map((a) => ({
      question_id: a.question_id,
      points_awarded: grades[a.question_id]?.points ?? a.points_awarded ?? 0,
      feedback: grades[a.question_id]?.feedback ?? a.feedback ?? '',
    }));
    gradeMutation.mutate({ answers: gradeAnswers });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/instructor/courses" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grade Assessment</h1>
          {assessmentData && <p className="text-sm text-slate-500 mt-0.5">{assessmentData.title}</p>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Submissions list */}
        <div className="lg:w-80 shrink-0">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Submissions</h2>
          {subsLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-400">No submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubmission(sub.id); setGrades({}); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSubmission === sub.id
                      ? 'border-teal-300 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium shrink-0">
                      {sub.user.first_name?.[0]}{sub.user.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {sub.user.first_name} {sub.user.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Attempt {sub.attempt_number}</span>
                        {sub.submitted_at && <span>{timeAgo(sub.submitted_at)}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[sub.status] || ''}`}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.score != null && (
                    <p className="text-xs text-slate-500 mt-1">
                      Score: {sub.score}/{sub.total_points} ({sub.total_points && sub.total_points > 0 ? Math.round((sub.score / sub.total_points) * 100) : 0}%)
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grading panel */}
        <div className="flex-1">
          {!selectedSubmission ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Select a submission to review and grade.</p>
            </div>
          ) : resultsLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {answers.map((a, idx) => {
                const isAutoGradeable = ['mcq', 'true_false', 'fill_blank'].includes(a.question.question_type);
                const currentPoints = grades[a.question_id]?.points ?? a.points_awarded ?? 0;
                const currentFeedback = grades[a.question_id]?.feedback ?? a.feedback ?? '';

                return (
                  <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs text-slate-400">Q{idx + 1} · {a.question.question_type.replace('_', ' ')} · {a.question.points} pts</span>
                        <p className="font-medium text-slate-800 mt-1">{a.question.question_text}</p>
                      </div>
                      {a.is_correct != null && (
                        <CheckCircle2 className={`h-5 w-5 shrink-0 ${a.is_correct ? 'text-emerald-500' : 'text-red-400'}`} />
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-slate-500 mb-1">Student Answer:</p>
                      <p className="text-sm text-slate-800">
                        {a.answer_text || (a.selected_options ? JSON.stringify(a.selected_options) : '(no answer)')}
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-emerald-600 mb-1">Correct Answer:</p>
                      <p className="text-sm text-emerald-800">{a.question.correct_answer}</p>
                    </div>

                    {a.question.explanation && (
                      <p className="text-xs text-slate-500 mb-3">Explanation: {a.question.explanation}</p>
                    )}

                    {/* Grading inputs */}
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-600">Points:</label>
                        <input
                          type="number"
                          min="0"
                          max={a.question.points}
                          value={currentPoints}
                          onChange={(e) => setGrades({ ...grades, [a.question_id]: { points: Number(e.target.value), feedback: currentFeedback } })}
                          disabled={isAutoGradeable && resultsData?.submission.status === 'graded'}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                        />
                        <span className="text-xs text-slate-400">/ {a.question.points}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={currentFeedback}
                          onChange={(e) => setGrades({ ...grades, [a.question_id]: { points: currentPoints, feedback: e.target.value } })}
                          placeholder="Feedback (optional)"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {answers.length > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleGrade}
                    disabled={gradeMutation.isPending}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    {gradeMutation.isPending ? 'Grading...' : 'Save Grades'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
