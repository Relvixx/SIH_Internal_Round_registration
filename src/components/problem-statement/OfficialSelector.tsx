// OfficialSelector component allows selecting an official SIH problem statement.
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { UseFormSetValue } from 'react-hook-form';
import { TeamRegistrationInput } from '@/lib/validation/schemas';

interface ProblemStatement {
  id: string;
  ps_id: string;
  title: string;
  organization: string;
  category?: string | null;
  theme?: string | null;
}

interface OfficialSelectorProps {
  setValue: UseFormSetValue<TeamRegistrationInput>;
}

export const OfficialSelector: React.FC<OfficialSelectorProps> = ({ setValue }) => {
  const [statements, setStatements] = useState<ProblemStatement[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProblemStatement | null>(null);

  useEffect(() => {
    // Load static JSON; replace with API fetch when endpoint is available.
    import('@/lib/data/sih-problem-statements.json')
      .then((mod) => setStatements(mod.default))
      .catch(() => setStatements([]));
  }, []);

  const filtered = statements.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.organization && s.organization.toLowerCase().includes(search.toLowerCase())) ||
    (s.category && s.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (stmt: ProblemStatement) => {
    setSelected(stmt);
    setValue('problem_statement_id', stmt.id);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Select Official Problem Statement</label>
      <Input placeholder="Search problem statements..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {search && (
        <div className="border border-[var(--color-border-subtle)] rounded mt-1 max-h-60 overflow-y-auto bg-[var(--color-canvas)]">
          {filtered.length === 0 && <p className="p-2 text-sm text-[var(--color-ink-tertiary)]">No matches found.</p>}
          {filtered.map((stmt) => (
            <button
              type="button"
              key={stmt.id}
              onClick={() => handleSelect(stmt)}
              className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center hover:bg-[var(--color-surface-50)] ${selected?.id === stmt.id ? 'bg-[var(--color-primary-subtle)]' : ''}`}
            >
              <span>{stmt.title}</span>
              <span className="text-xs text-[var(--color-ink-tertiary)]">{stmt.organization}</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <p className="mt-2 text-sm text-[var(--color-ink-secondary)]">
          Selected: <strong>{selected.title}</strong> ({selected.organization})
        </p>
      )}
    </div>
  );
};
