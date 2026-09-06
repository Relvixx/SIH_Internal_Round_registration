'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/branding/logo';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/rules', label: 'Rules' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border-subtle)]">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-medium transition-colors',
                  pathname === link.href
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                <Link href="/register">Register</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-[var(--color-ink)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="right">
        <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'px-4 py-3 rounded-[var(--radius-md)] text-[var(--font-size-base)] font-medium transition-colors',
                pathname === link.href
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                  : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 px-4">
            <Button className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
              <Link href="/register" onClick={() => setMobileOpen(false)}>Register Your Team</Link>
            </Button>
          </div>
        </nav>
      </Sheet>
    </header>
  );
}
