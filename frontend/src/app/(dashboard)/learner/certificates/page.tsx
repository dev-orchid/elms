'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Award, Download, ExternalLink, Link2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  certificate_url: string | null;
  issued_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
  };
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await api.get('/certificates/my');
      return res.data as { certificates: Certificate[] };
    },
  });

  const certificates = data?.certificates || [];

  const copyVerifyUrl = (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification URL copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">Certificates earned from completed courses</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No certificates yet</h3>
          <p className="text-sm text-slate-400">Complete a course with certification enabled to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Certificate preview header */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-center">
                <Award className="h-10 w-10 text-white/90 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Certificate of Completion</p>
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 line-clamp-1">{cert.course?.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Issued {formatDate(cert.issued_at)}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 font-mono">
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cert.verification_code}</span>
                </div>

                <div className="flex gap-2">
                  {cert.certificate_url && (
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}
                  <button
                    onClick={() => copyVerifyUrl(cert.verification_code)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
