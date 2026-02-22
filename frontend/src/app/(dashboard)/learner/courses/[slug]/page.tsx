'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  PlayCircle,
  MessageSquare,
  Megaphone,
  ClipboardCheck,
  Timer,
  RotateCcw,
  Target,
} from 'lucide-react';
import { formatDuration, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { CourseForum } from '@/components/forum/course-forum';
import api from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  duration_minutes?: number;
  sort_order: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  difficulty: string;
  estimated_hours?: number;
  is_certification_enabled: boolean;
  modules: Module[];
  course_instructors: Array<{
    role: string;
    profile: { id: string; first_name: string; last_name: string; avatar_url?: string; email: string };
  }>;
}

interface Progress {
  enrolled: boolean;
  progress: number;
  status: string | null;
  completed_lessons: number;
  total_lessons: number;
  next_lesson_id: string | null;
  completed_lesson_ids?: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const { user } = useAuthStore();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'syllabus' | 'assessments' | 'forum' | 'announcements'>('syllabus');

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', slug],
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

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/courses/${course!.id}/enroll`),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      queryClient.invalidateQueries({ queryKey: ['course-progress', course!.id] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to enroll');
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
        <Link href="/learner/courses" className="text-teal-600 hover:text-teal-700 text-sm mt-2 inline-block">
          Browse courses
        </Link>
      </div>
    );
  }

  const sortedModules = [...course.modules].sort((a, b) => a.sort_order - b.sort_order);
  const totalLessons = sortedModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalDuration = sortedModules.reduce(
    (sum, m) => sum + (m.lessons || []).reduce((s, l) => s + (l.duration_minutes || 0), 0),
    0,
  );
  const leadInstructor = course.course_instructors?.find((i) => i.role === 'lead')?.profile;
  const isEnrolled = progressData?.enrolled;
  const progress = progressData?.progress || 0;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/learner/courses"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-teal-500 to-teal-700 relative">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-16 w-16 text-teal-200" />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[course.difficulty] || ''}`}>
                  {course.difficulty}
                </span>
                {course.is_certification_enabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                    Certificate
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{course.title}</h1>
              {course.description && (
                <p className="text-slate-600 leading-relaxed">{course.description}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {sortedModules.length} module{sortedModules.length !== 1 ? 's' : ''}, {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
                {leadInstructor && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {leadInstructor.first_name} {leadInstructor.last_name}
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              {isEnrolled ? (
                <div className="text-center space-y-3">
                  {/* Progress bar */}
                  <div className="w-48">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{progressData?.completed_lessons || 0}/{progressData?.total_lessons || 0} lessons</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const lessonParam = progressData?.next_lesson_id
                        ? `?lesson=${progressData.next_lesson_id}`
                        : '';
                      router.push(`/learner/courses/${slug}/learn${lessonParam}`);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {progress >= 100 ? 'Review Course' : 'Continue Learning'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg shadow-sm transition-colors text-lg"
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {([
          { key: 'syllabus' as const, label: 'Syllabus', icon: BookOpen },
          { key: 'assessments' as const, label: 'Assessments', icon: ClipboardCheck },
          { key: 'forum' as const, label: 'Forum', icon: MessageSquare },
          { key: 'announcements' as const, label: 'Announcements', icon: Megaphone },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Syllabus tab */}
      {activeTab === 'syllabus' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Course Syllabus</h2>

            {sortedModules.length === 0 ? (
              <p className="text-sm text-slate-400">No content available yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedModules.map((mod, idx) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.sort_order - b.sort_order);
                  const modDuration = sortedLessons.reduce((s, l) => s + (l.duration_minutes || 0), 0);

                  return (
                    <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs text-slate-400 font-mono shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-medium text-slate-800 flex-1">{mod.title}</span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''}
                          {modDuration > 0 ? ` · ${formatDuration(modDuration)}` : ''}
                        </span>
                      </button>

                      {isExpanded && sortedLessons.length > 0 && (
                        <div className="divide-y divide-slate-100">
                          {sortedLessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 pl-14">
                              <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                              <span className="text-sm text-slate-700 flex-1">{lesson.title}</span>
                              {lesson.content_type && (
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                                  {lesson.content_type}
                                </span>
                              )}
                              {lesson.duration_minutes != null && lesson.duration_minutes > 0 && (
                                <span className="text-xs text-slate-400">{formatDuration(lesson.duration_minutes)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instructors */}
          {course.course_instructors?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Instructors</h2>
              <div className="flex flex-wrap gap-4">
                {course.course_instructors.map((instr) => (
                  <div key={instr.profile.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium">
                      {instr.profile.first_name?.[0]}{instr.profile.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {instr.profile.first_name} {instr.profile.last_name}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{instr.role} instructor</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Assessments tab */}
      {activeTab === 'assessments' && (
        <CourseAssessments courseId={course.id} />
      )}

      {/* Forum tab */}
      {activeTab === 'forum' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <CourseForum courseId={course.id} />
        </div>
      )}

      {/* Announcements tab */}
      {activeTab === 'announcements' && (
        <CourseAnnouncements courseId={course.id} />
      )}
    </div>
  );
}

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  mid_term: 'Midterm',
  final: 'Final',
  assignment: 'Assignment',
};

const ASSESSMENT_TYPE_COLORS: Record<string, string> = {
  quiz: 'bg-blue-100 text-blue-800',
  mid_term: 'bg-amber-100 text-amber-800',
  final: 'bg-red-100 text-red-800',
  assignment: 'bg-purple-100 text-purple-800',
};

function CourseAssessments({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['course-assessments', courseId],
    queryFn: async () => {
      const res = await api.get('/assessments', { params: { course_id: courseId, limit: '50' } });
      return res.data as {
        assessments: Array<{
          id: string;
          title: string;
          type: string;
          description?: string;
          time_limit_minutes?: number | null;
          max_attempts: number;
          passing_score: number;
          assessment_questions?: Array<{ question_id: string }>;
        }>;
      };
    },
  });

  const assessments = data?.assessments || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-400">No assessments available for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {assessments.map((a) => {
        const qCount = a.assessment_questions?.length ?? 0;
        return (
          <Link
            key={a.id}
            href={`/learner/assessments/${a.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                {a.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${ASSESSMENT_TYPE_COLORS[a.type] || 'bg-slate-100 text-slate-600'}`}>
                {ASSESSMENT_TYPE_LABELS[a.type] || a.type}
              </span>
            </div>
            {a.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{a.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {qCount} question{qCount !== 1 ? 's' : ''}
              </span>
              {a.time_limit_minutes && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  {a.time_limit_minutes} min
                </span>
              )}
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                {a.max_attempts} attempt{a.max_attempts !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Pass: {a.passing_score}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CourseAnnouncements({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['course-announcements', courseId],
    queryFn: async () => {
      const res = await api.get('/announcements', { params: { course_id: courseId, limit: '20' } });
      return res.data as {
        announcements: Array<{
          id: string;
          title: string;
          content: string;
          created_at: string;
          author: { id: string; first_name: string; last_name: string } | null;
        }>;
      };
    },
  });

  const announcements = data?.announcements || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Megaphone className="h-10 w-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-400">No announcements for this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <div key={ann.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-teal-600" />
            <h3 className="font-semibold text-slate-800">{ann.title}</h3>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{ann.content}</p>
          <p className="text-xs text-slate-400 mt-3">
            {ann.author?.first_name} {ann.author?.last_name} · {timeAgo(ann.created_at)}
          </p>
        </div>
      ))}
    </div>
  );
}
