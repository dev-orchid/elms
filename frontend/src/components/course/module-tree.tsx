'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ModuleFormModal } from './module-form-modal';
import { LessonFormModal } from './lesson-form-modal';

interface Lesson {
  id: string;
  title: string;
  content_type?: string;
  duration_minutes?: number;
  sort_order: number;
  description?: string;
  content_url?: string;
  content_body?: string;
  is_published?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  lessons: Lesson[];
}

interface ModuleTreeProps {
  courseId: string;
  modules: Module[];
}

export function ModuleTree({ courseId, modules }: ModuleTreeProps) {
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.map((m) => m.id)));

  // Module modal state
  const [moduleModal, setModuleModal] = useState<{
    open: boolean;
    editing?: Module;
  }>({ open: false });

  // Lesson modal state
  const [lessonModal, setLessonModal] = useState<{
    open: boolean;
    moduleId?: string;
    editing?: Lesson;
  }>({ open: false });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course', courseId] });

  // ─── Module mutations ─────────────────────────────────

  const createModule = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.post(`/courses/${courseId}/modules`, data),
    onSuccess: () => {
      toast.success('Module added');
      invalidate();
    },
    onError: () => toast.error('Failed to add module'),
  });

  const updateModule = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      api.patch(`/modules/${id}`, data),
    onSuccess: () => {
      toast.success('Module updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update module'),
  });

  const deleteModule = useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => {
      toast.success('Module deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete module'),
  });

  const reorderModules = useMutation({
    mutationFn: (order: { id: string; sort_order: number }[]) =>
      api.patch(`/courses/${courseId}/modules/reorder`, { order }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to reorder modules'),
  });

  // ─── Lesson mutations ─────────────────────────────────

  const createLesson = useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title: string; [key: string]: unknown }) =>
      api.post(`/modules/${moduleId}/lessons`, data),
    onSuccess: () => {
      toast.success('Lesson added');
      invalidate();
    },
    onError: () => toast.error('Failed to add lesson'),
  });

  const updateLesson = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.patch(`/lessons/${id}`, data),
    onSuccess: () => {
      toast.success('Lesson updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update lesson'),
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      toast.success('Lesson deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete lesson'),
  });

  const reorderLessons = useMutation({
    mutationFn: ({ moduleId, order }: { moduleId: string; order: { id: string; sort_order: number }[] }) =>
      api.patch(`/modules/${moduleId}/lessons/reorder`, { order }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to reorder lessons'),
  });

  // ─── Helpers ──────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const order = sorted.map((m, i) => {
      if (i === index) return { id: m.id, sort_order: sorted[swapIdx].sort_order };
      if (i === swapIdx) return { id: m.id, sort_order: sorted[index].sort_order };
      return { id: m.id, sort_order: m.sort_order };
    });
    reorderModules.mutate(order);
  };

  const moveLesson = (moduleId: string, lessons: Lesson[], index: number, direction: 'up' | 'down') => {
    const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order);
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const order = sorted.map((l, i) => {
      if (i === index) return { id: l.id, sort_order: sorted[swapIdx].sort_order };
      if (i === swapIdx) return { id: l.id, sort_order: sorted[index].sort_order };
      return { id: l.id, sort_order: l.sort_order };
    });
    reorderLessons.mutate({ moduleId, order });
  };

  const sortedModules = [...modules].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Course Content</h3>
        <button
          onClick={() => setModuleModal({ open: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Module
        </button>
      </div>

      {sortedModules.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No modules yet. Add your first module to get started.</p>
        </div>
      ) : (
        sortedModules.map((mod, modIdx) => {
          const isExpanded = expandedModules.has(mod.id);
          const sortedLessons = [...(mod.lessons || [])].sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div key={mod.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
              {/* Module Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                <button
                  onClick={() => toggleExpand(mod.id)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <span className="font-medium text-slate-800 flex-1">{mod.title}</span>
                <span className="text-xs text-slate-400">
                  {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => moveModule(modIdx, 'up')}
                    disabled={modIdx === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveModule(modIdx, 'down')}
                    disabled={modIdx === sortedModules.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setModuleModal({ open: true, editing: mod })}
                    className="p-1 text-slate-400 hover:text-teal-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this module and all its lessons?')) {
                        deleteModule.mutate(mod.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {sortedLessons.map((lesson, lessonIdx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 px-4 py-2.5 pl-12 hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                      <span className="text-sm text-slate-700 flex-1">{lesson.title}</span>
                      {lesson.content_type && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                          {lesson.content_type}
                        </span>
                      )}
                      {lesson.duration_minutes != null && lesson.duration_minutes > 0 && (
                        <span className="text-xs text-slate-400">{lesson.duration_minutes}m</span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveLesson(mod.id, sortedLessons, lessonIdx, 'up')}
                          disabled={lessonIdx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveLesson(mod.id, sortedLessons, lessonIdx, 'down')}
                          disabled={lessonIdx === sortedLessons.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setLessonModal({ open: true, moduleId: mod.id, editing: lesson })}
                          className="p-0.5 text-slate-400 hover:text-teal-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this lesson?')) {
                              deleteLesson.mutate(lesson.id);
                            }
                          }}
                          className="p-0.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Lesson button */}
                  <div className="px-4 py-2.5 pl-12">
                    <button
                      onClick={() => setLessonModal({ open: true, moduleId: mod.id })}
                      className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Module Modal */}
      <ModuleFormModal
        isOpen={moduleModal.open}
        onClose={() => setModuleModal({ open: false })}
        onSubmit={async (data) => {
          if (moduleModal.editing) {
            await updateModule.mutateAsync({ id: moduleModal.editing.id, ...data });
          } else {
            await createModule.mutateAsync(data);
          }
        }}
        defaultValues={
          moduleModal.editing
            ? { title: moduleModal.editing.title, description: moduleModal.editing.description }
            : undefined
        }
        isEditing={!!moduleModal.editing}
      />

      {/* Lesson Modal */}
      <LessonFormModal
        isOpen={lessonModal.open}
        onClose={() => setLessonModal({ open: false })}
        onSubmit={async (data) => {
          if (lessonModal.editing) {
            await updateLesson.mutateAsync({ id: lessonModal.editing.id, ...data });
          } else if (lessonModal.moduleId) {
            await createLesson.mutateAsync({ moduleId: lessonModal.moduleId, ...data });
          }
        }}
        defaultValues={
          lessonModal.editing
            ? {
                title: lessonModal.editing.title,
                description: lessonModal.editing.description,
                content_type: lessonModal.editing.content_type as 'video' | 'document' | 'text' | 'quiz' | 'assignment' | undefined,
                content_url: lessonModal.editing.content_url || '',
                content_body: lessonModal.editing.content_body || '',
                duration_minutes: lessonModal.editing.duration_minutes,
              }
            : undefined
        }
        isEditing={!!lessonModal.editing}
      />
    </div>
  );
}
