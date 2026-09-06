import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 md:py-16 text-center', className)}>
      <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-canvas-subtle)] flex items-center justify-center mb-4">
        {icon || <Inbox className="h-6 w-6 text-[var(--color-ink-muted)]" />}
      </div>
      <h3 className="text-card-title text-[var(--color-ink)] mb-1">{title}</h3>
      {description && (
        <p className="text-body-sm text-[var(--color-ink-tertiary)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
