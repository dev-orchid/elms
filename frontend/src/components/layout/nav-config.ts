import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  Trophy,
  Library,
  HelpCircle,
  ClipboardCheck,
  BarChart3,
  Users,
  Package,
  ScrollText,
  Settings,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const learnerNav: NavItem[] = [
  { label: 'Dashboard', href: '/learner', icon: LayoutDashboard },
  { label: 'Browse Courses', href: '/learner/courses', icon: BookOpen },
  { label: 'My Learning', href: '/learner/my-learning', icon: GraduationCap },
  { label: 'Certificates', href: '/learner/certificates', icon: Award },
  { label: 'Leaderboard', href: '/learner/leaderboard', icon: Trophy },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
];

export const instructorNav: NavItem[] = [
  { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
  { label: 'My Courses', href: '/instructor/courses', icon: Library },
  { label: 'Question Bank', href: '/instructor/question-bank', icon: HelpCircle },
  { label: 'Assessments', href: '/instructor/assessments', icon: ClipboardCheck },
  { label: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'All Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Bundles', href: '/admin/bundles', icon: Package },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
];

export function getNavForRole(role: string | null): NavItem[] {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return adminNav;
    case 'instructor':
      return instructorNav;
    default:
      return learnerNav;
  }
}

export function getRoleHome(role: string | null): string {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin';
    case 'instructor':
      return '/instructor';
    default:
      return '/learner';
  }
}
