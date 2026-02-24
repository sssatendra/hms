'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarDays, FileText, Pill,
  FlaskConical, Settings, ChevronRight, Building2
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { hasPermission } from '@/lib/auth-store';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', href: '/patients', icon: Users, permission: 'patients:read' },
  { label: 'Appointments', href: '/appointments', icon: CalendarDays, permission: 'appointments:read' },
  { label: 'EMR & Notes', href: '/emr', icon: FileText, permission: 'emr:read' },
  { label: 'Pharmacy', href: '/pharmacy', icon: Pill, permission: 'pharmacy:read' },
  { label: 'Laboratory', href: '/lab', icon: FlaskConical, permission: 'lab:read' },
  { label: 'Admissions & Wards', href: '/wards', icon: Building2, permission: 'wards:read' },
  { label: 'Billing', href: '/billing', icon: FileText, permission: 'billing:read' },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Users', href: '/users', icon: Building2, permission: 'users:read' },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant } = useAuthStore();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const filterItems = (items: NavItem[]) =>
    items.filter((item) =>
      !item.permission || hasPermission(user?.role || '', item.permission)
    );

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-foreground text-sm truncate">
              {tenant?.name || 'HMS Portal'}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{tenant?.slug}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filterItems(NAV_ITEMS).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            {item.label}
            {item.badge && (
              <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        {/* Admin section */}
        {filterItems(ADMIN_ITEMS).length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {filterItems(ADMIN_ITEMS).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.first_name, user.last_name) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
