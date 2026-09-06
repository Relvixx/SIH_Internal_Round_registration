import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-canvas-subtle)] text-[var(--color-ink-secondary)] border-[var(--color-border)]',
  info: 'bg-[var(--color-info-subtle)] text-[var(--color-info)] border-[var(--color-info)]/15',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success)]/15',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning)]/15',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/15',
  outline: 'bg-transparent text-[var(--color-ink-secondary)] border-[var(--color-border)]',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)] font-medium border leading-tight',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// StatusBadge maps team status to the correct variant automatically
import { TEAM_STATUS_LABELS, TEAM_STATUS_VARIANTS, type TeamStatus } from '@/lib/constants';

interface StatusBadgeProps {
  status: TeamStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={TEAM_STATUS_VARIANTS[status]} className={className}>
      {TEAM_STATUS_LABELS[status]}
    </Badge>
  );
}
