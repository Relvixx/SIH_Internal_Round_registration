'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/branding/logo';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/problem-statements', label: 'Problem Statements', icon: FileText },
  { href: '/admin/evaluations', label: 'Evaluations', icon: ClipboardCheck },
  { href: '/admin/exports', label: 'Exports', icon: Download },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-medium transition-colors',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
          : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[var(--width-admin-sidebar)] border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] h-screen sticky top-0">
      <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <Logo />
        <p className="text-metadata mt-2">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <LogoutButton />
    </aside>
  );
}

export function AdminTopBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = navItems.find((item) => pathname.startsWith(item.href));

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition-colors -ml-2"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5 text-[var(--color-ink)]" />
            </button>
            <Logo variant="compact" />
          </div>
          {currentPage && (
            <span className="text-[var(--font-size-sm)] font-medium text-[var(--color-ink-secondary)]">
              {currentPage.label}
            </span>
          )}
        </div>
      </header>

      <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Navigation" side="left">
        <nav className="flex flex-col p-3 gap-0.5" aria-label="Mobile admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[var(--font-size-base)] font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 mt-auto border-t border-[var(--color-border-subtle)]">
          <LogoutButton />
        </div>
      </Sheet>
    </>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="px-3 py-4 border-t border-[var(--color-border-subtle)]">
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors disabled:opacity-50"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        <span>{loading ? 'Signing out…' : 'Sign Out'}</span>
      </button>
    </div>
  );
}
