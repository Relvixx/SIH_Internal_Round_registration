import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-[var(--color-canvas-subtle)]',
  primary: 'bg-[var(--color-primary-subtle)]',
  success: 'bg-[var(--color-success-subtle)]',
  warning: 'bg-[var(--color-warning-subtle)]',
  danger: 'bg-[var(--color-danger-subtle)]',
};

const iconVariantStyles = {
  default: 'text-[var(--color-ink-tertiary)]',
  primary: 'text-[var(--color-primary)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  danger: 'text-[var(--color-danger)]',
};

export function StatCard({ label, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-5 shadow-[var(--shadow-xs)]',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-metadata mb-1">{label}</p>
          <p className="text-[1.75rem] font-semibold text-[var(--color-ink)] leading-tight">{value}</p>
          {trend && (
            <p className="text-caption mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center', variantStyles[variant])}>
            <Icon className={cn('h-5 w-5', iconVariantStyles[variant])} />
          </div>
        )}
      </div>
    </div>
  );
}
