'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/auth-store';
import { getRoleHome } from '@/components/layout/nav-config';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase sets the session from the URL hash automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          router.push('/login');
          return;
        }

        // Fetch or create profile via our backend
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        setAuth(res.data.user, session.access_token);
        router.push(getRoleHome(res.data.user.role));
      } catch {
        router.push('/login');
      }
    };

    handleCallback();
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-slate-600">Signing you in...</p>
      </div>
    </div>
  );
}
