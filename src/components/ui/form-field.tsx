import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[var(--font-size-sm)] font-medium text-[var(--color-ink)]"
      >
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-ink-tertiary)]">{hint}</p>
      )}
      {error && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-danger)] flex items-start gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
