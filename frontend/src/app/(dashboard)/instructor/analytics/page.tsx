'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Target, AlertTriangle, BookOpen } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface AtRiskLearner {
  user_id: string;
  name: string;
  email: string;
  progress: number;
  enrolled_at: string;
}

interface ScoreDistribution {
  assessment_title: string;
  avg_score: number;
  submissions: number;
}

interface CourseAnalytics {
  total_students: number;
  avg_progress: number;
  completed: number;
  enrollment_trend: Array<{ date: string; count: number }>;
  at_risk_learners: AtRiskLearner[];
  score_distribution: ScoreDistribution[];
}

export default function InstructorAnalyticsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      const res = await api.get('/courses?limit=200');
      return (res.data.courses || []) as CourseOption[];
    },
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['course-analytics', selectedCourseId],
    queryFn: async () => {
      const res = await api.get(`/instructor/analytics/${selectedCourseId}`);
      return res.data.analytics as CourseAnalytics;
    },
    enabled: !!selectedCourseId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Course Analytics</h1>
        <p className="text-slate-500 mt-1">Deep dive into student performance and engagement.</p>
      </div>

      {/* Course Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Choose a course...</option>
          {(courses || []).map((c) => (
            <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
          ))}
        </select>
      </div>

      {!selectedCourseId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">Select a course to view analytics.</p>
        </div>
      )}

      {selectedCourseId && isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {analytics && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: analytics.total_students, icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Avg. Progress', value: `${analytics.avg_progress}%`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Completed', value: analytics.completed, icon: Target, color: 'bg-teal-50 text-teal-600' },
              { label: 'At Risk', value: analytics.at_risk_learners.length, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Enrollment Trend</h2>
              {analytics.enrollment_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.enrollment_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No enrollment data yet.</p>
              )}
            </div>

            {/* Assessment Scores */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Assessment Scores</h2>
              {analytics.score_distribution.length > 0 ? (
                <div className="space-y-3">
                  {analytics.score_distribution.map((sd) => (
                    <div key={sd.assessment_title} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 truncate flex-1">{sd.assessment_title}</span>
                        <span className="text-slate-500 ml-2">{sd.submissions} submissions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${sd.avg_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 w-12 text-right">{sd.avg_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No graded assessments yet.</p>
              )}
            </div>
          </div>

          {/* At-Risk Learners */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              <AlertTriangle className="inline h-5 w-5 text-red-500 mr-2" />
              At-Risk Learners
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Enrolled for 7+ days with less than 20% progress.
            </p>
            {analytics.at_risk_learners.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No at-risk learners. Great job!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Student</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Progress</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-600">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.at_risk_learners.map((l) => (
                      <tr key={l.user_id} className="border-b border-slate-100">
                        <td className="px-4 py-2 text-slate-800">{l.name}</td>
                        <td className="px-4 py-2 text-slate-600">{l.email}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400 rounded-full" style={{ width: `${l.progress}%` }} />
                            </div>
                            <span className="text-xs text-red-600 font-medium">{l.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-500">{new Date(l.enrolled_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
