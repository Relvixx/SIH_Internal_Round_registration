'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, side = 'right', children, className }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-[min(320px,85vw)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] flex flex-col',
          'transition-transform duration-[var(--transition-slow)]',
          side === 'right' ? 'right-0' : 'left-0',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Navigation'}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-card-title">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-[var(--color-ink-tertiary)]" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
