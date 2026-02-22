import Link from 'next/link';
import {
  BookOpen,
  Users,
  Award,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  GraduationCap,
  Globe,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Course Management',
    desc: 'Create, organize, and deliver engaging courses with modules, lessons, and structured learning paths.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    desc: 'Learners, instructors, and admins each get tailored dashboards and permissions.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Award,
    title: 'Certificates',
    desc: 'Auto-generated certificates with unique verification codes and public validation pages.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    desc: 'Track progress, grades, at-risk learners, and engagement with rich dashboards and charts.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Shield,
    title: 'Assessments & Grading',
    desc: 'Quizzes, exams, and assignments with auto-grading, timed tests, and manual review workflows.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Zap,
    title: 'Gamification',
    desc: 'Points, badges, leaderboards, and daily streaks to drive engagement and completion rates.',
    color: 'bg-teal-50 text-teal-600',
  },
];

const stats = [
  { value: 'Unlimited', label: 'Courses', icon: BookOpen },
  { value: 'Real-time', label: 'Collaboration', icon: Globe },
  { value: 'Built-in', label: 'Certificates', icon: GraduationCap },
  { value: 'Full', label: 'Analytics Suite', icon: BarChart3 },
];

const highlights = [
  'Role-based dashboards for learners, instructors, and admins',
  'Course bundles and sequential learning paths',
  'Discussion forums and direct messaging',
  'Real-time notifications and live updates',
  'Audit logging and CSV export',
  'Mobile-responsive design',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">ELMS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-white" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-medium text-teal-700 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Enterprise-grade LMS
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              The modern platform for{' '}
              <span className="text-teal-600">enterprise learning</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
              A complete learning management system with role-based course management,
              assessments, certificates, gamification, and real-time collaboration — built for organizations that value education.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/20 transition-all hover:shadow-xl hover:shadow-teal-600/30"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-teal-100 text-teal-600 mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything you need to manage learning
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              From course creation to certification — a complete toolkit for modern education.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-200 hover:border-teal-200 bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-5 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Highlights ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Built for teams that take learning seriously
              </h2>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Whether you're onboarding new employees, running certification programs, or managing
                a full training operation — ELMS has the tools you need.
              </p>
            </div>
            <div className="space-y-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Ready to transform your training?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Create your free account and start building courses in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-600/20 transition-all"
            >
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-teal-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">ELMS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/login" className="hover:text-slate-700 transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-slate-700 transition-colors">Register</Link>
              <Link href="/verify" className="hover:text-slate-700 transition-colors">Verify Certificate</Link>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise Learning Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
