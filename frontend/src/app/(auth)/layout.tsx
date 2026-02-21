import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-slate-800">
              <span className="text-blue-600">ELMS</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Enterprise Learning Management System</p>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
