import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  info: { bg: 'bg-[var(--color-info-subtle)]', border: 'border-[var(--color-info)]/20', icon: Info, iconColor: 'text-[var(--color-info)]' },
  success: { bg: 'bg-[var(--color-success-subtle)]', border: 'border-[var(--color-success)]/20', icon: CheckCircle2, iconColor: 'text-[var(--color-success)]' },
  warning: { bg: 'bg-[var(--color-warning-subtle)]', border: 'border-[var(--color-warning)]/20', icon: AlertTriangle, iconColor: 'text-[var(--color-warning)]' },
  danger: { bg: 'bg-[var(--color-danger-subtle)]', border: 'border-[var(--color-danger)]/20', icon: AlertCircle, iconColor: 'text-[var(--color-danger)]' },
};

export function Alert({ variant = 'info', title, children, onDismiss, className }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-[var(--radius-md)] border',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-[var(--font-size-sm)] text-[var(--color-ink)] mb-0.5">{title}</p>}
        <div className="text-[var(--font-size-sm)] text-[var(--color-ink-secondary)]">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-[var(--color-ink-tertiary)]" />
        </button>
      )}
    </div>
  );
}
