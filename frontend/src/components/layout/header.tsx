'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, ChevronRight, User, LogOut, Search, Star, Check, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeTable } from '@/hooks/use-realtime';
import api from '@/lib/api';

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = seg
      .replace(/[-_]/g, ' ')
      .replace(/\[.*\]/, '')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, href };
  });

  return (
    <nav className="hidden sm:flex items-center text-sm text-slate-500">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1 text-slate-400" />}
          {i === crumbs.length - 1 ? (
            <span className="text-slate-800 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-700">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function UserDropdown() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-slate-700">
          {user?.first_name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          {user && (
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function PointsBadge() {
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['my-points-badge'],
    queryFn: async () => {
      const res = await api.get('/gamification/my-stats');
      return res.data as { points: number; level: string; streak_days: number };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  if (!data || !user || user.role !== 'learner') return null;

  return (
    <Link
      href="/learner/leaderboard"
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
    >
      <Star className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-xs font-semibold text-amber-700">{data.points.toLocaleString()}</span>
      {data.streak_days > 0 && (
        <span className="text-xs text-amber-500">({data.streak_days}d)</span>
      )}
    </Link>
  );
}

function NotificationBell() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: countData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data as { count: number };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit: '8' } });
      return res.data as { notifications: Array<{ id: string; type: string; title: string; body: string; reference_url?: string; is_read: boolean; created_at: string }> };
    },
    enabled: !!user && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  // Realtime: new notification → increment count + toast
  useRealtimeTable<{ id: string; title: string; user_id: string }>({
    table: 'notifications',
    event: 'INSERT',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onInsert: (n) => {
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
      toast(n.title || 'New notification', { icon: '🔔' });
    },
  });

  const unread = countData?.count || 0;
  const notifications = notifData?.notifications || [];

  const handleClick = (notif: { id: string; reference_url?: string; is_read: boolean }) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id);
    if (notif.reference_url) router.push(notif.reference_url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    !n.is_read ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="h-2 w-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />}
                    <div className={!n.is_read ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.body}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeAchievementPopup() {
  const { user } = useAuthStore();
  const [badge, setBadge] = useState<{ name: string } | null>(null);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useRealtimeTable<{ user_id: string; badge_id: string }>({
    table: 'user_badges',
    event: 'INSERT',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user && user.role === 'learner',
    onInsert: async (record) => {
      // Fetch badge name
      try {
        const res = await api.get('/gamification/badges');
        const badges = (res.data?.badges || []) as Array<{ id: string; name: string; earned: boolean }>;
        const earned = badges.find((b) => b.id === record.badge_id);
        setBadge({ name: earned?.name || 'New Badge' });
        setConfettiPieces(
          Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.5,
            color: ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)],
          })),
        );
        setTimeout(() => { setBadge(null); setConfettiPieces([]); }, 4000);
      } catch {
        // ignore
      }
    },
  });

  if (!badge) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-start justify-center pt-20">
      {/* Confetti */}
      {confettiPieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {/* Badge card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-teal-200 p-6 text-center animate-badge-pop pointer-events-auto">
        <div className="h-16 w-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <Award className="h-8 w-8" />
        </div>
        <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Achievement Unlocked!</p>
        <p className="text-lg font-bold text-slate-800 mt-1">{badge.name}</p>
      </div>
    </div>
  );
}

export function Header() {
  const { setMobileMenuOpen } = useUIStore();

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          {/* Points badge for learners */}
          <PointsBadge />

          {/* Search */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notification bell */}
          <NotificationBell />

          {/* User dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* Badge achievement popup with confetti */}
      <BadgeAchievementPopup />
    </>
  );
}
