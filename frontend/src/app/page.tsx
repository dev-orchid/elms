import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Award,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Globe,
  Target,
  Clock,
  CheckCircle2,
  Play,
  Star,
  Trophy,
  FileText,
  MessageSquare,
  Cpu,
  Atom,
  Landmark,
  BriefcaseBusiness,
  Calculator,
  Brain,
  FlaskConical,
  Shield,
  ChevronRight,
  UserPlus,
  Search,
  BadgeCheck,
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────────────────────────── */

const examBadges = [
  'UPSC', 'SSC', 'State PSC', 'Banking', 'JEE', 'NEET', 'GATE', 'CAT',
];

const categories = [
  { icon: Landmark, title: 'UPSC Civil Services', courses: 24 },
  { icon: Globe, title: 'State PSC', courses: 18 },
  { icon: BriefcaseBusiness, title: 'SSC & Banking', courses: 22 },
  { icon: Shield, title: 'GATE & ESE', courses: 15 },
  { icon: FlaskConical, title: 'JEE & NEET', courses: 20 },
  { icon: Cpu, title: 'Technology & Programming', courses: 30 },
  { icon: Brain, title: 'Data Science & AI', courses: 16 },
  { icon: Atom, title: 'Science & Mathematics', courses: 14 },
];

const platformStats = [
  { icon: BookOpen, value: '100+', label: 'Courses', desc: 'Across tech, science & exam prep' },
  { icon: Users, value: '50+', label: 'Expert Educators', desc: 'Industry & academic professionals' },
  { icon: Target, value: '10,000+', label: 'Active Learners', desc: 'Growing community every day' },
  { icon: Trophy, value: '95%', label: 'Success Rate', desc: 'Learners who meet their goals' },
];

const featureShowcase = [
  {
    icon: BookOpen,
    title: 'Structured Courses',
    desc: 'Comprehensive, module-based courses designed by expert educators. Progress at your own pace with clear learning paths from beginner to advanced.',
    bullets: ['Video & text lessons', 'Downloadable resources', 'Progress tracking'],
    mockType: 'course' as const,
  },
  {
    icon: FileText,
    title: 'Assessments & Mock Tests',
    desc: 'Timed practice tests, quizzes, and full-length mock exams with instant auto-grading. Identify your strengths and weaknesses before the real exam.',
    bullets: ['Timed exam simulation', 'Auto-graded answers', 'Detailed analytics'],
    mockType: 'quiz' as const,
  },
  {
    icon: Award,
    title: 'Certificates & Gamification',
    desc: 'Earn verifiable certificates on completion. Stay motivated with points, badges, leaderboards, and daily streaks that reward consistency.',
    bullets: ['Verifiable certificates', 'Badges & achievements', 'Leaderboards & streaks'],
    mockType: 'certificate' as const,
  },
];

const steps = [
  { icon: UserPlus, title: 'Sign up for free', desc: 'Create your account in seconds — no credit card required.' },
  { icon: Search, title: 'Choose your course or exam', desc: 'Browse our catalog and pick the goal that matches your ambition.' },
  { icon: BadgeCheck, title: 'Learn, practice & get certified', desc: 'Complete courses, ace assessments, and earn certificates to prove your skills.' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    goal: 'UPSC Aspirant',
    quote: 'ELMS transformed how I study. The structured courses and mock tests gave me a clear roadmap. I cleared my prelims on the first attempt!',
    stars: 5,
  },
  {
    name: 'Rahul Deshpande',
    goal: 'Software Developer',
    quote: 'The programming courses here are top-notch. I went from basic Python to building full-stack apps. The certificates helped me land my dream job.',
    stars: 5,
  },
  {
    name: 'Ananya Reddy',
    goal: 'JEE Aspirant',
    quote: 'Timed mock tests and auto-grading saved me months of guesswork. I could see exactly where I stood and what to focus on. Absolutely recommend!',
    stars: 5,
  },
];

const footerPlatform = ['Courses', 'Assessments', 'Certificates', 'Leaderboard'];
const footerExam = ['UPSC', 'State PSC', 'SSC', 'Banking', 'JEE / NEET', 'GATE'];
const footerCompany = ['About Us', 'Careers', 'Blog', 'Contact', 'Privacy Policy', 'Terms of Service'];

/* ─── Floating Badge Positions (hero illustration) ─────────────── */
const floatingBadges = [
  { label: 'UPSC', top: '8%', left: '10%', delay: '0s' },
  { label: 'JEE', top: '18%', right: '8%', delay: '0.5s' },
  { label: 'SSC', top: '45%', left: '5%', delay: '1s' },
  { label: 'NEET', top: '55%', right: '12%', delay: '1.5s' },
  { label: 'GATE', top: '78%', left: '15%', delay: '0.8s' },
  { label: 'CAT', top: '72%', right: '5%', delay: '1.2s' },
];

/* ─── Page Component ──────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Inline keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
      `}</style>

      {/* ─── 1. Navbar (sticky glassmorphism) ─────────────────── */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ELMS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#categories" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Courses</a>
            <a href="#exam-prep" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Exam Prep</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Features</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/20 to-white">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight">
                Learn, prepare &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500">crack any exam</span>
              </h1>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {['PS', 'RD', 'AR', 'VK'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  Join <span className="font-semibold text-slate-800">10,000+</span> learners already on ELMS
                </p>
              </div>

              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">
                Comprehensive courses in technology, science, UPSC, state civil services, SSC, and competitive exams — with assessments, certificates, and everything you need to succeed.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5"
                >
                  Explore courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all hover:border-slate-400">
                  <Play className="h-4 w-4 text-teal-600" />
                  Watch demo
                </button>
              </div>
            </div>

            {/* Right column — decorative card with floating badges */}
            <div className="hidden lg:block relative">
              <div className="relative w-full h-[420px]">
                {/* Main gradient card */}
                <div className="absolute inset-4 rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 shadow-2xl shadow-teal-600/30 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Your learning journey</p>
                          <p className="text-white/70 text-xs">3 courses in progress</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white rounded-full h-2 w-3/5" />
                      </div>
                      <p className="text-white/80 text-xs mt-2">60% overall completion</p>
                    </div>
                  </div>
                </div>

                {/* Floating exam badges */}
                {floatingBadges.map((b) => (
                  <div
                    key={b.label}
                    className="animate-float absolute px-4 py-2 bg-white rounded-xl shadow-lg shadow-slate-200/60 border border-slate-100 text-xs font-bold text-slate-700"
                    style={{
                      top: b.top,
                      left: b.left,
                      right: b.right,
                      animationDelay: b.delay,
                    } as React.CSSProperties}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Trusted-By / Exam Badge Strip ─────────────────── */}
      <section id="exam-prep" className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm font-medium text-slate-500 mb-5">
            Trusted by learners preparing for
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {examBadges.map((badge) => (
              <span
                key={badge}
                className="px-5 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Exam / Goal Category Grid ─────────────────────── */}
      <section id="categories" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Choose your goal
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Whether it&apos;s cracking a competitive exam or mastering a new skill — pick your path and start learning today.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href="/register"
                className="group relative p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xl hover:shadow-teal-50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base">
                  {cat.title}
                </h3>
                <span className="inline-block mt-2 text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                  {cat.courses}+ courses
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View all categories
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. Platform Statistics ────────────────────────────── */}
      <section className="bg-slate-900 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {platformStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-500/10 text-teal-400 mb-4">
                  <stat.icon className="h-7 w-7" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </p>
                <p className="text-sm font-semibold text-slate-300 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-500 mt-1 hidden sm:block">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Feature Showcase (alternating rows) ───────────── */}
      <section id="features">
        {featureShowcase.map((feature, idx) => (
          <div key={feature.title} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${idx % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
                {/* Text side */}
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {feature.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-sm text-slate-700">
                        <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mock card side */}
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  {feature.mockType === 'course' && <MockCourseCard />}
                  {feature.mockType === 'quiz' && <MockQuizCard />}
                  {feature.mockType === 'certificate' && <MockCertificateCard />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ─── 7. How It Works ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How ELMS works
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in three simple steps — from sign-up to certification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

            {steps.map((step, idx) => (
              <div key={step.title} className="relative text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 mb-5 relative z-10">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="absolute -top-2 -right-2 md:static md:hidden inline-flex items-center justify-center h-6 w-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Testimonials ──────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              What learners say
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from students who have transformed their preparation and career with ELMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed text-sm mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.goal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Final CTA ─────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Start your learning journey today
          </h2>
          <p className="mt-4 text-lg text-teal-100 max-w-xl mx-auto">
            Join thousands of learners preparing for exams, building tech skills, and achieving their goals on ELMS.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-teal-700 bg-white hover:bg-teal-50 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-teal-200">
            Already have an account?{' '}
            <Link href="/login" className="text-white font-medium underline underline-offset-2 hover:text-teal-50">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ─── 10. Footer ───────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Logo + tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">ELMS</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                E-Learning Portal for Tech, Science & Exam Preparation. Quality education, accessible to all.
              </p>
              <div className="flex items-center gap-3">
                {['T', 'L', 'Y'].map((letter) => (
                  <div key={letter} className="h-9 w-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer">
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2: Platform */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3">
                {footerPlatform.map((item) => (
                  <li key={item}>
                    <Link href="/register" className="text-sm hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Exam Prep */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Exam Prep</h4>
              <ul className="space-y-3">
                {footerExam.map((item) => (
                  <li key={item}>
                    <Link href="/register" className="text-sm hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {footerCompany.map((item) => (
                  <li key={item}>
                    <span className="text-sm hover:text-white transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; 2026 ELMS. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
              Made in India
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Mock UI Cards (feature showcase) ────────────────────────── */

function MockCourseCard() {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Python Masterclass</p>
            <p className="text-xs text-slate-500">12 modules &middot; 48 lessons</p>
          </div>
        </div>
        <div className="space-y-2.5 mb-4">
          {['Introduction to Python', 'Data Structures', 'OOP Concepts'].map((mod, i) => (
            <div key={mod} className="flex items-center gap-3 text-xs text-slate-600">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 2 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                {i < 2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : (i + 1)}
              </div>
              {mod}
            </div>
          ))}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-teal-500 rounded-full h-2 w-2/3" />
        </div>
        <p className="text-xs text-slate-500 mt-2">67% complete</p>
      </div>
    </div>
  );
}

function MockQuizCard() {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">UPSC Prelims Mock #3</p>
              <p className="text-xs text-slate-500">100 questions &middot; 120 min</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            45:22
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-700 mb-2">Q12. The Indus Valley Civilization was primarily located in:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Punjab region', 'Gangetic plain', 'Deccan plateau', 'Western Ghats'].map((opt, i) => (
                <div key={opt} className={`text-[11px] px-2.5 py-1.5 rounded-md border ${i === 0 ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>12 of 100 answered</span>
          <div className="w-20 bg-slate-100 rounded-full h-1.5">
            <div className="bg-teal-500 rounded-full h-1.5 w-[12%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCertificateCard() {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 text-amber-500 mb-3">
            <Award className="h-7 w-7" />
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Certificate of Completion</p>
          <p className="text-lg font-bold text-slate-900">Python Masterclass</p>
          <p className="text-sm text-slate-600 mt-1">Priya Sharma</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
            <span>Issued: Jan 2026</span>
            <span className="h-3 w-px bg-slate-200" />
            <span>ID: ELMS-2026-0042</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          {[
            { icon: Trophy, label: '5 Badges', color: 'text-amber-500' },
            { icon: Zap, label: '1,250 XP', color: 'text-teal-500' },
            { icon: BarChart3, label: 'Top 10%', color: 'text-blue-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
