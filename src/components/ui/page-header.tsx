import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ── Page Header ──
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8', className)}>
      <div>
        <h1 className="text-page-title text-[var(--color-ink)]">{title}</h1>
        {description && (
          <p className="text-body text-[var(--color-ink-secondary)] mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Section Heading ──
interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h2 className="text-section-title text-[var(--color-ink)]">{title}</h2>
        {description && (
          <p className="text-body-sm text-[var(--color-ink-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── Breadcrumb ──
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-[var(--font-size-sm)] mb-4', className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />}
          {item.href ? (
            <Link href={item.href} className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-ink)] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
