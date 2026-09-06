import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ── Skeleton ──
interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('skeleton h-4 w-full', className)} />
      ))}
    </>
  );
}

// ── Spinner ──
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-[var(--color-ink-muted)]', spinnerSizes[size], className)}
      aria-label="Loading"
    />
  );
}

// ── Full-section loading ──
export function LoadingSection({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Spinner size="lg" />
      {message && <p className="text-body-sm text-[var(--color-ink-tertiary)]">{message}</p>}
    </div>
  );
}
