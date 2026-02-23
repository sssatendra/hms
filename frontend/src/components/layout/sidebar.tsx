'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarDays, FileText, Pill,
  FlaskConical, Hospital, Settings, ChevronRight, Building2
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Hospital className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">
              {tenant?.name || 'HMS Portal'}
            </h1>
            <p className="text-xs text-gray-500 truncate">{tenant?.slug}</p>
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
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.first_name, user.last_name) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
