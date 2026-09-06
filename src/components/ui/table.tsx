import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ── Table Shell ──
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]', className)}>
      <table className="w-full text-[var(--font-size-sm)]">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--color-canvas-subtle)] border-b border-[var(--color-border)]">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--color-border-subtle)]">{children}</tbody>;
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn('hover:bg-[var(--color-surface-hover)] transition-colors', className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-metadata font-medium whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-[var(--color-ink)]', className)} {...props}>
      {children}
    </td>
  );
}

// ── Pagination Shell ──
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3', className)}>
      <p className="text-caption">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-[var(--font-size-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-[var(--font-size-sm)] rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── Search Input ──
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--font-size-sm)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
      />
    </div>
  );
}
