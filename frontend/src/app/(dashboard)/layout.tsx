'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Header } from '@/components/layout/header';
import { useRealtimeTable } from '@/hooks/use-realtime';

function GradingListener() {
  const { user } = useAuthStore();

  // Realtime: submissions UPDATE → "Assessment graded" toast for learners
  useRealtimeTable<{ id: string; user_id: string; status: string }>({
    table: 'submissions',
    event: 'UPDATE',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user && user.role === 'learner',
    onUpdate: (record) => {
      if (record.status === 'graded') {
        toast.success('Your assessment has been graded!', {
          description: 'Check your results now.',
          action: {
            label: 'View',
            onClick: () => window.location.href = '/learner/my-learning',
          },
        });
      }
    },
  });

  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isLoading } = useAuthStore();

  useEffect(() => {
    // If not loading and no auth, redirect to login
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <MobileSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <GradingListener />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
