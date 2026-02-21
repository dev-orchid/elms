'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { getNavForRole, type NavItem } from './nav-config';

function MobileNavLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function MobileSidebar() {
  const { user } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const navItems = getNavForRole(user?.role ?? null);

  if (!mobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-800 text-white flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <Link href="/" className="text-xl font-bold text-white">
            <span className="text-blue-400">ELMS</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              onClose={() => setMobileMenuOpen(false)}
            />
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-slate-400 capitalize">{user.role?.replace('_', ' ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
