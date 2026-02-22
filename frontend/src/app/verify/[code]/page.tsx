'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface VerifyResult {
  certificate: {
    id: string;
    verification_code: string;
    certificate_url: string | null;
    issued_at: string;
    user: { id: string; first_name: string; last_name: string; avatar_url: string | null };
    course: { id: string; title: string; slug: string; thumbnail_url: string | null; description: string | null };
  };
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params.code as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-certificate', code],
    queryFn: async () => {
      const res = await api.get(`/certificates/verify/${code}`);
      return res.data as VerifyResult;
    },
  });

  const cert = data?.certificate;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              F
            </div>
            <span className="text-lg font-bold text-slate-800">Finesse ELMS</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Verifying certificate...</p>
          </div>
        ) : isError || !cert ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Certificate Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">
              The verification code <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{code}</code> does not match any certificate in our system.
            </p>
            <Link href="/" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              Go to homepage
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Valid badge */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Valid Certificate</span>
            </div>

            {/* Certificate info */}
            <div className="p-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                <Award className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">Certificate of Completion</h2>
                <p className="text-sm text-slate-500 mt-1">This certifies that</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {cert.user.avatar_url ? (
                  <img src={cert.user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium">
                    {cert.user.first_name?.[0]}{cert.user.last_name?.[0]}
                  </div>
                )}
                <p className="text-lg font-semibold text-teal-700">
                  {cert.user.first_name} {cert.user.last_name}
                </p>
              </div>

              <p className="text-sm text-slate-500">has successfully completed</p>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800">{cert.course.title}</h3>
                {cert.course.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cert.course.description}</p>
                )}
              </div>

              <div className="space-y-1 text-sm text-slate-500">
                <p>Issued on {formatDate(cert.issued_at)}</p>
                <p className="font-mono text-xs text-slate-400">{cert.verification_code}</p>
              </div>

              {cert.certificate_url && (
                <a
                  href={cert.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Full Certificate
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
