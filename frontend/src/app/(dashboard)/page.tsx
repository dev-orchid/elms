'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getRoleHome } from '@/components/layout/nav-config';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const destination = getRoleHome(user?.role ?? null);
    router.replace(destination);
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
