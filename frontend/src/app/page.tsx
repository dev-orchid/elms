import Link from 'next/link';
import { BookOpen, Users, Award, BarChart3, Shield, Zap } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Course Management', desc: 'Create, organize, and deliver engaging courses with modules and lessons' },
  { icon: Users, title: 'Role-Based Access', desc: 'Learners, Instructors, and Admins each get tailored experiences' },
  { icon: Award, title: 'Certificates', desc: 'Auto-generated certificates with unique verification codes' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track progress, grades, and engagement across the platform' },
  { icon: Shield, title: 'Assessments', desc: 'Quizzes, exams, and assignments with auto-grading support' },
  { icon: Zap, title: 'Gamification', desc: 'Points, badges, leaderboards, and streaks to drive engagement' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            <span className="text-teal-600">ELMS</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Enterprise Learning{' '}
            <span className="text-teal-600">Management System</span>
          </h2>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            A full-stack LMS for organizations that need role-based course management,
            assessments, certificates, and real-time collaboration — built for scale.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-12">
            Everything you need to manage learning
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-lg border border-slate-200 hover:border-teal-200 hover:shadow-sm transition-all">
                <f.icon className="h-8 w-8 text-teal-600 mb-4" />
                <h4 className="text-lg font-semibold text-slate-900">{f.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-500">
          ELMS — Enterprise Learning Management System
        </p>
      </footer>
    </div>
  );
}
