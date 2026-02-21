'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, ChevronRight, User, LogOut, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/use-auth';

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

export function Header() {
  const { setMobileMenuOpen } = useUIStore();

  return (
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
        {/* Search */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
