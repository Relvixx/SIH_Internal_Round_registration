import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
};

export function Card({ children, padding = 'md', hover, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)]',
        paddingStyles[padding],
        hover && 'transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-md)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-card-title">{title}</h3>
        {description && (
          <p className="text-body-sm text-[var(--color-ink-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
