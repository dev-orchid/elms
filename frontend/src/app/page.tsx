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
  Star,
  Trophy,
  FileText,
  Cpu,
  Landmark,
  BriefcaseBusiness,
  Brain,
  ChevronRight,
  UserPlus,
  Search,
  BadgeCheck,
  Palette,
  Sprout,
  Languages,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────────────────────────── */

const skillBadges = [
  'Digital Marketing', 'Web Development', 'Data Science', 'Creative Arts',
  'Business', 'Kiswahili', 'Education', 'Agriculture',
];

const categories = [
  { icon: Globe, title: 'Digital Marketing & Social Media', courses: 24 },
  { icon: Cpu, title: 'Web Development & Design', courses: 22 },
  { icon: Brain, title: 'Data Science & AI', courses: 18 },
  { icon: BriefcaseBusiness, title: 'Business & Entrepreneurship', courses: 20 },
  { icon: Landmark, title: 'Humanities & Social Studies', courses: 16 },
  { icon: Languages, title: 'Kiswahili & Languages', courses: 14 },
  { icon: Sprout, title: 'Agriculture & Environment', courses: 15 },
  { icon: Palette, title: 'Creative Arts & Media', courses: 12 },
];

/* Hero subject icons — colorful floating badges in the illustration area */
const heroSubjects: { icon: LucideIcon; label: string; bg: string; iconColor: string; top: string; left?: string; right?: string; delay: string }[] = [
  { icon: Globe, label: 'Marketing', bg: 'bg-orange-400', iconColor: 'text-white', top: '5%', left: '2%', delay: '0s' },
  { icon: Cpu, label: 'Web Dev', bg: 'bg-sky-400', iconColor: 'text-white', top: '8%', right: '5%', delay: '0.6s' },
  { icon: Brain, label: 'Data & AI', bg: 'bg-violet-400', iconColor: 'text-white', top: '35%', left: '0%', delay: '1.2s' },
  { icon: BriefcaseBusiness, label: 'Business', bg: 'bg-amber-400', iconColor: 'text-white', top: '40%', right: '0%', delay: '0.3s' },
  { icon: Landmark, label: 'Humanities', bg: 'bg-rose-400', iconColor: 'text-white', top: '65%', left: '5%', delay: '0.9s' },
  { icon: Sprout, label: 'Agriculture', bg: 'bg-emerald-400', iconColor: 'text-white', top: '70%', right: '2%', delay: '1.5s' },
];

const platformStats = [
  { icon: BookOpen, value: '100+', label: 'Courses', desc: 'Across digital skills, humanities & more' },
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
    desc: 'Timed practice tests, quizzes, and comprehensive assessments with instant auto-grading. Identify your strengths and weaknesses to guide your learning.',
    bullets: ['Timed assessments', 'Auto-graded answers', 'Detailed analytics'],
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
  { icon: Search, title: 'Choose your course', desc: 'Browse our catalog and pick the skill that matches your ambition.' },
  { icon: BadgeCheck, title: 'Learn, practice & get certified', desc: 'Complete courses, ace assessments, and earn certificates to prove your skills.' },
];

const testimonials = [
  {
    name: 'Amina Wanjiku',
    goal: 'Digital Marketer',
    quote: 'ELMS transformed my career. The digital marketing courses gave me hands-on skills I use every day. I now run campaigns for three Nairobi-based businesses!',
    stars: 5,
  },
  {
    name: 'Brian Ochieng',
    goal: 'Software Developer',
    quote: 'The programming courses here are top-notch. I went from basic Python to building full-stack apps. The certificates helped me land my dream job in tech.',
    stars: 5,
  },
  {
    name: 'Faith Muthoni',
    goal: 'Humanities Student',
    quote: 'The Kiswahili and humanities courses are so well structured. The assessments helped me track my progress and the certificates boosted my portfolio. Highly recommend!',
    stars: 5,
  },
];

const footerPlatform = ['Courses', 'Assessments', 'Certificates', 'Leaderboard'];
const footerSkills = ['Digital Marketing', 'Web Development', 'Data Science', 'Business', 'Humanities', 'Agriculture'];
const footerCompany = ['About Us', 'Careers', 'Blog', 'Contact', 'Privacy Policy', 'Terms of Service'];

/* ─── Page Component ──────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Inline keyframes */}
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

      {/* ─── 1. Navbar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Explore + Search */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-teal-600 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight hidden sm:block">ELMS</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#categories" className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors rounded-lg hover:bg-slate-50">
                Explore
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-400">Search courses...</span>
            </div>
          </div>

          {/* Right: Nav links + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <a href="#features" className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors rounded-lg hover:bg-slate-50">Features</a>
              <a href="#skills" className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors rounded-lg hover:bg-slate-50">Skills</a>
            </nav>

            <div className="h-5 w-px bg-slate-200 hidden md:block" />

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. Hero Section ──────────────────────────────────── */}
      <section className="relative bg-slate-50 overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left column — Headline + illustration area */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                For every learner,{' '}
                <span className="text-teal-600">every goal.</span>
                <br />
                <span className="text-slate-900">Real results.</span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-lg">
                We&apos;re a nonprofit with the mission to provide free, world-class education for anyone, anywhere.
              </p>

              {/* Illustration area with floating subject badges */}
              <div className="relative mt-10 h-[320px] sm:h-[360px] hidden sm:block">
                {/* Central decorative shapes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-teal-100/60" />
                </div>
                <div className="absolute top-8 left-16 w-40 h-40 rounded-full bg-amber-100/50" />
                <div className="absolute bottom-4 right-12 w-32 h-32 rounded-full bg-sky-100/50" />
                <div className="absolute bottom-16 left-8 w-24 h-24 rounded-full bg-rose-100/40" />

                {/* Floating subject badges */}
                {heroSubjects.map((s) => (
                  <div
                    key={s.label}
                    className="animate-float absolute flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-md border border-slate-100"
                    style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay } as React.CSSProperties}
                  >
                    <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{s.label}</span>
                  </div>
                ))}

                {/* Decorative doodle-style lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 360" fill="none">
                  <path d="M80 180 Q150 120 220 180 Q290 240 360 180" stroke="#14b8a6" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
                  <path d="M120 280 Q200 220 280 260 Q340 290 400 250" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.25" />
                  <circle cx="100" cy="100" r="4" fill="#14b8a6" opacity="0.3" />
                  <circle cx="380" cy="140" r="5" fill="#f59e0b" opacity="0.3" />
                  <circle cx="300" cy="300" r="3" fill="#ec4899" opacity="0.3" />
                  {/* Small star shapes */}
                  <path d="M420 80 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#14b8a6" opacity="0.25" />
                  <path d="M60 250 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill="#f59e0b" opacity="0.25" />
                </svg>
              </div>
            </div>

            {/* Right column — "Start learning today" card */}
            <div className="lg:pt-4">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 sm:p-10">
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 leading-tight mb-8">
                  Start learning today
                </h2>

                {/* Role selector cards */}
                <div className="space-y-4">
                  <Link
                    href="/register"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-teal-200 bg-teal-50/50 hover:border-teal-400 hover:bg-teal-50 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition-colors">
                      <BookOpen className="h-6 w-6 text-teal-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900">Learners</p>
                      <p className="text-sm text-slate-500">Explore courses, practice, and earn certificates</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-teal-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/register"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                      <GraduationCap className="h-6 w-6 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900">Educators</p>
                      <p className="text-sm text-slate-500">Create courses and assessments for your students</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 shrink-0 group-hover:translate-x-1 group-hover:text-teal-500 transition-all" />
                  </Link>

                  <Link
                    href="/register"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 group-hover:bg-sky-200 transition-colors">
                      <Users className="h-6 w-6 text-sky-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900">Organizations</p>
                      <p className="text-sm text-slate-500">Train your team with structured learning paths</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 shrink-0 group-hover:translate-x-1 group-hover:text-teal-500 transition-all" />
                  </Link>
                </div>

                {/* Learner count */}
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['AW', 'BO', 'FM', 'JK'].map((initials) => (
                      <div key={initials} className="h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-[9px] font-bold text-white">
                        {initials}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    Join <span className="font-semibold text-slate-700">10,000+</span> learners
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 3. Trusted-By / Skill Badge Strip ─────────────────── */}
      <section id="skills" className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm font-medium text-slate-500 mb-5">
            Trusted by learners building skills in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {skillBadges.map((badge) => (
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
              Whether it&apos;s mastering digital skills, exploring humanities, or growing your career — pick your path and start learning today.
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
              Hear from learners who have transformed their skills and career with ELMS.
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
            Join thousands of learners across Kenya building digital skills, exploring humanities, and achieving their goals on ELMS.
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
                E-Learning Portal for Digital Skills, Humanities & Professional Growth. Quality education, accessible to all Kenyans.
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

            {/* Col 3: Skills */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Skills</h4>
              <ul className="space-y-3">
                {footerSkills.map((item) => (
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
              Built for Kenya
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
              <p className="text-sm font-semibold text-slate-900">Digital Marketing Quiz #3</p>
              <p className="text-xs text-slate-500">30 questions &middot; 45 min</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            45:22
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-700 mb-2">Q12. Which social media metric best measures audience engagement?</p>
            <div className="grid grid-cols-2 gap-2">
              {['Click-through rate', 'Impressions', 'Reach', 'Page views'].map((opt, i) => (
                <div key={opt} className={`text-[11px] px-2.5 py-1.5 rounded-md border ${i === 0 ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>12 of 30 answered</span>
          <div className="w-20 bg-slate-100 rounded-full h-1.5">
            <div className="bg-teal-500 rounded-full h-1.5 w-[40%]" />
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
          <p className="text-sm text-slate-600 mt-1">Amina Wanjiku</p>
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
