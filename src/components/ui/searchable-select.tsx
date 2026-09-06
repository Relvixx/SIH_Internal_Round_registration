import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  subLabel?: string;
  searchTerms?: string[];
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className,
  error
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const searchLower = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(searchLower) || 
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchLower)) ||
      (opt.searchTerms && opt.searchTerms.some(term => term.toLowerCase().includes(searchLower)))
    );
  });

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-left bg-[var(--color-surface)] border rounded-[var(--radius-md)] text-[var(--font-size-base)] transition-colors",
          error
            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/30 focus:outline-none focus:ring-2'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2',
          !selectedOption && "text-[var(--color-ink-tertiary)]"
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 ml-2 text-[var(--color-ink-tertiary)] shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-lg max-h-60 flex flex-col">
          {/* Search Input */}
          <div className="flex items-center px-3 border-b border-[var(--color-border-subtle)]">
            <Search className="w-4 h-4 text-[var(--color-ink-tertiary)] shrink-0" />
            <input
              type="text"
              className="w-full px-2 py-2 bg-transparent border-none focus:outline-none text-[var(--font-size-base)]"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-2 text-center text-sm text-[var(--color-ink-tertiary)]">
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "flex flex-col w-full px-2 py-1.5 text-left rounded-sm text-[var(--font-size-base)] hover:bg-[var(--color-canvas-subtle)] transition-colors",
                    value === opt.value && "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{opt.label}</span>
                    {value === opt.value && <Check className="w-4 h-4" />}
                  </div>
                  {opt.subLabel && (
                    <span className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{opt.subLabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
