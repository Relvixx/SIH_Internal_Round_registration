import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-ink)] text-[var(--font-size-base)] appearance-none',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237A7A8A%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")]',
          'bg-no-repeat bg-[right_0.75rem_center] pr-10',
          'transition-colors duration-[var(--transition-fast)]',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/30'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
