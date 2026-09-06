'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        'bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]',
        'w-[calc(100%-2rem)] max-w-lg p-0 m-auto',
        'open:animate-[dialog-in_200ms_ease-out]',
        className
      )}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-section-title text-[var(--color-ink)]">{title}</h2>
            {description && (
              <p className="text-body-sm text-[var(--color-ink-secondary)] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition-colors -mr-1.5 -mt-1.5"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-[var(--color-ink-tertiary)]" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
