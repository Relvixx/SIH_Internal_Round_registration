import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
    return (
      <label htmlFor={checkboxId} className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30 cursor-pointer accent-[var(--color-primary)]"
          {...props}
        />
        {label && <span className="text-[var(--font-size-base)] text-[var(--color-ink)]">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
