import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-ink)] text-[var(--font-size-base)]',
          'placeholder:text-[var(--color-ink-muted)]',
          'transition-colors duration-[var(--transition-fast)]',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-canvas-subtle)]',
          error
            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/30'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
