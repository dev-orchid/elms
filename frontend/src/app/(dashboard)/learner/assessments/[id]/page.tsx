'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trophy,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface Question {
  id: string;
  question_type: string;
  question_text: string;
  options?: { id: string; text: string }[];
  points: number;
}

interface SavedAnswer {
  question_id: string;
  answer_text?: string;
  selected_options?: unknown;
}

type Phase = 'loading' | 'pre-start' | 'taking' | 'review' | 'results';

interface GradeResult {
  score: number;
  total_points: number;
  status: string;
  percentage: number;
}

export default function TakeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, { answer_text?: string; selected_options?: unknown }>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);

  // Start the assessment
  const startMutation = useMutation({
    mutationFn: () => api.post(`/assessments/${assessmentId}/start`),
    onSuccess: (res) => {
      const data = res.data;
      setSubmissionId(data.submission.id);
      setQuestions((data.questions || []).filter(Boolean));
      setAssessmentTitle(data.assessment?.title || 'Assessment');

      // Restore saved answers
      const saved: Record<string, { answer_text?: string; selected_options?: unknown }> = {};
      for (const a of data.answers || []) {
        saved[a.question_id] = { answer_text: a.answer_text, selected_options: a.selected_options };
      }
      setAnswers(saved);

      // Set timer
      if (data.assessment?.time_limit_minutes) {
        const elapsed = Math.floor(
          (Date.now() - new Date(data.submission.started_at).getTime()) / 1000,
        );
        const remaining = data.assessment.time_limit_minutes * 60 - elapsed;
        setTimeLeft(Math.max(0, remaining));
      }

      setPhase('taking');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to start assessment');
      setPhase('pre-start');
    },
  });

  // Save answer
  const saveMutation = useMutation({
    mutationFn: (data: { question_id: string; answer_text?: string | null; selected_options?: unknown }) =>
      api.post(`/submissions/${submissionId}/answer`, data),
  });

  // Submit
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/submissions/${submissionId}/submit`),
    onSuccess: (res) => {
      setResult(res.data.result);
      setPhase('results');
    },
    onError: () => toast.error('Failed to submit assessment'),
  });

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || phase !== 'taking') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Auto-submit on time expire
          submitMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load — go to pre-start
  useEffect(() => {
    setPhase('pre-start');
  }, []);

  const handleStart = () => {
    setPhase('loading');
    startMutation.mutate();
  };

  const setAnswer = useCallback(
    (questionId: string, value: { answer_text?: string; selected_options?: unknown }) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      // Auto-save
      if (submissionId) {
        saveMutation.mutate({
          question_id: questionId,
          answer_text: value.answer_text || null,
          selected_options: value.selected_options || null,
        });
      }
    },
    [submissionId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleSubmit = () => {
    if (confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      submitMutation.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = questions.filter((q) => answers[q.id]?.answer_text || answers[q.id]?.selected_options).length;

  // ─── Pre-start screen ─────────────────────────────────

  if (phase === 'pre-start') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Ready to begin?</h1>
        <p className="text-slate-500">Once you start, the timer begins. Make sure you have enough time to complete the assessment.</p>
        <button
          onClick={handleStart}
          disabled={startMutation.isPending}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors text-lg"
        >
          {startMutation.isPending ? 'Starting...' : 'Start Assessment'}
        </button>
        <button
          onClick={() => router.back()}
          className="block mx-auto text-sm text-slate-500 hover:text-slate-700"
        >
          Go back
        </button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Results screen ───────────────────────────────────

  if (phase === 'results') {
    const passed = result && result.percentage >= 70;
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{passed ? 'Congratulations!' : 'Assessment Complete'}</h1>
        {result && (
          <div className="space-y-2">
            <p className="text-4xl font-bold text-slate-800">{Math.round(result.percentage)}%</p>
            <p className="text-slate-500">
              Score: {result.score} / {result.total_points} points
            </p>
            <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {passed ? 'Passed' : 'Not Passed'}
            </span>
            {result.status === 'submitted' && (
              <p className="text-sm text-amber-600 mt-2">Some questions require manual grading. You&apos;ll be notified when grading is complete.</p>
            )}
          </div>
        )}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              // Reset state for retake
              setPhase('pre-start');
              setSubmissionId(null);
              setQuestions([]);
              setAnswers({});
              setCurrentIdx(0);
              setTimeLeft(null);
              setResult(null);
            }}
            className="px-6 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium rounded-lg transition-colors"
          >
            Retake Assessment
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // ─── Review screen ────────────────────────────────────

  if (phase === 'review') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Review Your Answers</h2>
        <p className="text-sm text-slate-500">
          {answeredCount}/{questions.length} questions answered. Review before submitting.
        </p>

        <div className="space-y-2">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const hasAnswer = !!(ans?.answer_text || ans?.selected_options);
            return (
              <button
                key={q.id}
                onClick={() => { setCurrentIdx(idx); setPhase('taking'); }}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-teal-200 text-left"
              >
                {hasAnswer ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                )}
                <span className="text-sm text-slate-800 flex-1 line-clamp-1">Q{idx + 1}: {q.question_text}</span>
                <span className="text-xs text-slate-400">{q.points} pts</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => setPhase('taking')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Back to Questions
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Taking screen — one question at a time ───────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{assessmentTitle}</h2>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${
            timeLeft < 60 ? 'bg-red-100 text-red-700' : timeLeft < 300 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question indicator dots */}
      <div className="flex gap-1.5 flex-wrap">
        {questions.map((q, idx) => {
          const hasAnswer = !!(answers[q.id]?.answer_text || answers[q.id]?.selected_options);
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                idx === currentIdx
                  ? 'bg-teal-600 text-white'
                  : hasAnswer
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
            <span className="text-xs text-slate-400">{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}</span>
          </div>

          <p className="text-slate-800 font-medium mb-6">{currentQuestion.question_text}</p>

          {/* MCQ */}
          {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
            <div className="space-y-2">
              {(currentQuestion.options as { id: string; text: string }[]).map((opt) => {
                const selected = answers[currentQuestion.id]?.selected_options === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswer(currentQuestion.id, { selected_options: opt.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-200'
                    }`}
                  >
                    {selected ? (
                      <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                    )}
                    <span className="text-sm text-slate-700">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex gap-3">
              {['true', 'false'].map((val) => {
                const selected = answers[currentQuestion.id]?.answer_text === val;
                return (
                  <button
                    key={val}
                    onClick={() => setAnswer(currentQuestion.id, { answer_text: val })}
                    className={`flex-1 p-3 rounded-lg border text-center font-medium capitalize transition-all ${
                      selected
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:border-teal-200'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill blank / Short answer / Essay */}
          {['fill_blank', 'short_answer', 'essay'].includes(currentQuestion.question_type) && (
            <textarea
              rows={currentQuestion.question_type === 'essay' ? 8 : 2}
              value={answers[currentQuestion.id]?.answer_text || ''}
              onChange={(e) => setAnswer(currentQuestion.id, { answer_text: e.target.value })}
              placeholder={currentQuestion.question_type === 'essay' ? 'Write your essay here...' : 'Type your answer...'}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <span className="text-sm text-slate-500">{answeredCount}/{questions.length} answered</span>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setPhase('review')}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Review & Submit
          </button>
        )}
      </div>
    </div>
  );
}
