import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Award, GraduationCap, Lightbulb } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — Light branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-teal-50/40" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.04) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          {/* Logo */}
          <div className="mb-4">
            <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
              <span className="text-teal-600">ELMS</span>
            </h2>
          </div>

          {/* Tagline */}
          <p className="text-slate-500 text-lg text-center leading-relaxed max-w-sm mb-6">
            Digital skills, humanities & professional growth —
            <br />learn anything, achieve everything.
          </p>

          {/* Illustration */}
          <div className="w-full max-w-sm mb-8">
            <Image
              src="/auth-illustration.svg"
              alt="Learning illustration"
              width={500}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full max-w-md">
            {[
              { icon: BookOpen, text: 'Digital skills courses' },
              { icon: GraduationCap, text: 'Humanities & languages' },
              { icon: Award, text: 'Certificates & badges' },
              { icon: Lightbulb, text: 'Professional growth' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                  <feature.icon className="h-4 w-4 text-teal-600" />
                </div>
                <span className="text-slate-600 text-xs">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-teal-100/40" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-teal-100/30" />
      </div>

      {/* Right — Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-10 lg:hidden">
            <Link href="/">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                <span className="text-teal-600">ELMS</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">E-Learning Portal for Everyone</p>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
