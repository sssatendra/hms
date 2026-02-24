'use client';

import { useState, useEffect } from 'react';
import { Bell, LogOut, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/lib/auth-store';

export function Header() {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
        <div className="flex-1 max-w-md" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </header>
    );
  }
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients, appointments..."
            className="w-full pl-10 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-muted/50 text-foreground"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
