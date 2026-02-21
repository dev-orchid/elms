import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — decorative image */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Welcome to ELMS</h2>
              <p className="text-teal-100 text-lg leading-relaxed">
                Enterprise Learning Management System — manage courses, track progress, and empower learners across your organization.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-12">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">500+</p>
                <p className="text-teal-200 text-sm mt-1">Courses</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">10k+</p>
                <p className="text-teal-200 text-sm mt-1">Learners</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">98%</p>
                <p className="text-teal-200 text-sm mt-1">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:text-left">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-slate-800">
                <span className="text-teal-600">ELMS</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Enterprise Learning Management System</p>
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
