import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function Logo({ variant = 'full', className }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5 group', className)}>
      {/* Stylized mark */}
      <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-[var(--shadow-sm)] group-hover:shadow-[var(--shadow-md)] transition-shadow">
        <span className="text-white font-bold text-[var(--font-size-base)] leading-none">S</span>
      </div>
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="text-[var(--font-size-sm)] font-semibold text-[var(--color-ink)] leading-tight tracking-tight">
            SIH Internal
          </span>
          <span className="text-[var(--font-size-xs)] text-[var(--color-ink-tertiary)] leading-tight">
            MET BKC Polytechnic
          </span>
        </div>
      )}
    </Link>
  );
}
