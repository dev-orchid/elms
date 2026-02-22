'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Instructor {
  id: string;
  instructor_id: string;
  role: string;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface InstructorManagerProps {
  courseId: string;
  instructors: Instructor[];
}

const ROLE_COLORS: Record<string, string> = {
  lead: 'bg-teal-100 text-teal-800',
  assistant: 'bg-blue-100 text-blue-800',
  grader: 'bg-amber-100 text-amber-800',
};

export function InstructorManager({ courseId, instructors }: InstructorManagerProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [instructorId, setInstructorId] = useState('');
  const [role, setRole] = useState<'lead' | 'assistant' | 'grader'>('assistant');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course', courseId] });

  const addInstructor = useMutation({
    mutationFn: (data: { instructor_id: string; role: string }) =>
      api.post(`/courses/${courseId}/instructors`, data),
    onSuccess: () => {
      toast.success('Instructor added');
      setShowAddForm(false);
      setInstructorId('');
      invalidate();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to add instructor');
    },
  });

  const removeInstructor = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/courses/${courseId}/instructors/${id}`),
    onSuccess: () => {
      toast.success('Instructor removed');
      invalidate();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || 'Failed to remove instructor');
    },
  });

  const handleAdd = () => {
    if (!instructorId.trim()) {
      toast.error('Please enter an instructor ID');
      return;
    }
    addInstructor.mutate({ instructor_id: instructorId.trim(), role });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Instructors</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Instructor
        </button>
      </div>

      {/* Add Instructor Form */}
      {showAddForm && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructor User ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 text-sm"
                  placeholder="Paste the instructor's user ID..."
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'lead' | 'assistant' | 'grader')}
                className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white text-sm"
              >
                <option value="lead">Lead</option>
                <option value="assistant">Assistant</option>
                <option value="grader">Grader</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={addInstructor.isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg transition-colors"
            >
              {addInstructor.isPending ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Instructor List */}
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 bg-white">
        {instructors.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            No instructors assigned yet.
          </div>
        ) : (
          instructors.map((instr) => (
            <div key={instr.instructor_id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-medium shrink-0">
                {instr.profile.first_name?.[0]}{instr.profile.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {instr.profile.first_name} {instr.profile.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{instr.profile.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[instr.role] || 'bg-slate-100 text-slate-600'}`}>
                {instr.role}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Remove ${instr.profile.first_name} ${instr.profile.last_name} from this course?`)) {
                    removeInstructor.mutate(instr.instructor_id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-red-600 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
