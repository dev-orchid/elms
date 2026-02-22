'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  CheckCircle2,
  Circle,
  BookOpen,
  PlayCircle,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import api from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  content_url?: string;
  content_body?: string;
  duration_minutes?: number;
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  modules: Module[];
}

interface Progress {
  enrolled: boolean;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  completed_lesson_ids?: string[];
}

export default function LessonViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const initialLessonId = searchParams.get('lesson');

  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialLessonId);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-learn', slug],
    queryFn: async () => {
      const res = await api.get(`/courses/by-slug/${slug}`);
      return res.data.course as Course;
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['course-progress', course?.id],
    queryFn: async () => {
      const res = await api.get(`/courses/${course!.id}/progress`);
      return res.data.progress as Progress;
    },
    enabled: !!course?.id,
  });

  // Build flat ordered lesson list
  const orderedLessons = useMemo(() => {
    if (!course) return [];
    const sorted = [...course.modules].sort((a, b) => a.sort_order - b.sort_order);
    const flat: { lesson: Lesson; moduleTitle: string; moduleId: string }[] = [];
    for (const mod of sorted) {
      const lessons = [...(mod.lessons || [])].sort((a, b) => a.sort_order - b.sort_order);
      for (const lesson of lessons) {
        flat.push({ lesson, moduleTitle: mod.title, moduleId: mod.id });
      }
    }
    return flat;
  }, [course]);

  // Sync completed lessons from server progress data
  useEffect(() => {
    if (progressData?.completed_lesson_ids) {
      setCompletedLessons(new Set(progressData.completed_lesson_ids));
    }
  }, [progressData]);

  // Set initial lesson and expand its module
  useEffect(() => {
    if (!course || orderedLessons.length === 0) return;

    if (!activeLessonId || !orderedLessons.find((l) => l.lesson.id === activeLessonId)) {
      setActiveLessonId(orderedLessons[0].lesson.id);
    }

    // Expand all modules initially
    const allModuleIds = new Set(course.modules.map((m) => m.id));
    setExpandedModules(allModuleIds);
  }, [course, orderedLessons, activeLessonId]);

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: (_data, lessonId) => {
      setCompletedLessons((prev) => new Set(prev).add(lessonId));
      toast.success('Lesson completed!');
      queryClient.invalidateQueries({ queryKey: ['course-progress', course?.id] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to mark as complete');
    },
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Course not found.</p>
      </div>
    );
  }

  const currentIdx = orderedLessons.findIndex((l) => l.lesson.id === activeLessonId);
  const currentEntry = currentIdx >= 0 ? orderedLessons[currentIdx] : null;
  const activeLesson = currentEntry?.lesson;
  const prevLesson = currentIdx > 0 ? orderedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < orderedLessons.length - 1 ? orderedLessons[currentIdx + 1] : null;
  const progress = progressData?.progress || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-0 -m-4 lg:-m-6 min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:min-h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <Link
            href={`/learner/courses/${slug}`}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to course
          </Link>
          <h2 className="font-semibold text-slate-800 text-sm line-clamp-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{progressData?.completed_lessons || 0}/{progressData?.total_lessons || 0} lessons</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Module tree */}
        <div className="py-2">
          {[...course.modules].sort((a, b) => a.sort_order - b.sort_order).map((mod) => {
            const isExpanded = expandedModules.has(mod.id);
            const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-50"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex-1 line-clamp-1">
                    {mod.title}
                  </span>
                </button>

                {isExpanded && (
                  <div>
                    {sortedLessons.map((lesson) => {
                      const isActive = lesson.id === activeLessonId;
                      const isComplete = completedLessons.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`w-full flex items-center gap-2 px-4 py-2 pl-9 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-teal-50 text-teal-800 border-r-2 border-teal-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <span className="flex-1 line-clamp-1">{lesson.title}</span>
                          {lesson.duration_minutes != null && lesson.duration_minutes > 0 && (
                            <span className="text-xs text-slate-400 shrink-0">{lesson.duration_minutes}m</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeLesson ? (
          <>
            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-slate-400 mb-1">{currentEntry?.moduleTitle}</p>
                <h1 className="text-xl font-bold text-slate-800 mb-1">{activeLesson.title}</h1>
                {activeLesson.description && (
                  <p className="text-sm text-slate-500 mb-4">{activeLesson.description}</p>
                )}

                {activeLesson.duration_minutes != null && activeLesson.duration_minutes > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 mb-6">
                    <BookOpen className="h-3 w-3" />
                    {formatDuration(activeLesson.duration_minutes)}
                  </span>
                )}

                {/* Content rendering */}
                <div className="mt-4">
                  {activeLesson.content_type === 'video' && activeLesson.content_url && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        key={activeLesson.id}
                        src={activeLesson.content_url}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  {activeLesson.content_type === 'pdf' && activeLesson.content_url && (
                    <iframe
                      key={activeLesson.id}
                      src={activeLesson.content_url}
                      className="w-full h-[70vh] rounded-lg border border-slate-200"
                    />
                  )}

                  {(activeLesson.content_type === 'embed' || activeLesson.content_type === 'slides') && activeLesson.content_url && (
                    <iframe
                      key={activeLesson.id}
                      src={activeLesson.content_url}
                      className="w-full h-[70vh] rounded-lg border border-slate-200"
                      allowFullScreen
                    />
                  )}

                  {activeLesson.content_type === 'text' && activeLesson.content_body && (
                    <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                      {activeLesson.content_body}
                    </div>
                  )}

                  {!activeLesson.content_url && !activeLesson.content_body && (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No content available for this lesson yet.</p>
                    </div>
                  )}
                </div>

                {/* Mark complete button */}
                <div className="mt-8 flex justify-center">
                  {completedLessons.has(activeLesson.id) ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-5 w-5" />
                      Lesson Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => completeMutation.mutate(activeLesson.id)}
                      disabled={completeMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {completeMutation.isPending ? 'Marking...' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Prev/Next navigation */}
            <div className="border-t border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
              {prevLesson ? (
                <button
                  onClick={() => setActiveLessonId(prevLesson.lesson.id)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-xs text-slate-400">Previous</p>
                    <p className="line-clamp-1">{prevLesson.lesson.title}</p>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => setActiveLessonId(nextLesson.lesson.id)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Next</p>
                    <p className="line-clamp-1">{nextLesson.lesson.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a lesson to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
