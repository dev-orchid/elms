'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { getNavForRole, type NavItem } from './nav-config';

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-teal-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navItems = getNavForRole(user?.role ?? null);

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 h-screen sticky top-0',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-200',
        sidebarCollapsed ? 'justify-center' : 'justify-between',
      )}>
        {!sidebarCollapsed && (
          <Link href="/" className="text-xl font-bold text-slate-800">
            <span className="text-teal-600">ELMS</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className={cn(
          'p-4 border-t border-slate-200 flex items-center gap-3',
          sidebarCollapsed && 'justify-center',
        )}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
              {initials}
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
