'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { SearchInput } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { TEAM_STATUS_LABELS } from '@/lib/constants';

export function TeamsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set('page', '1'); // reset page on filter change
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      createQueryString('search', search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, createQueryString]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by registration code, title..."
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={searchParams.get('status') || ''}
          onChange={(e) => createQueryString('status', e.target.value)}
          className="w-full"
        >
          <option value="">All Statuses</option>
          {Object.entries(TEAM_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      <div className="w-full sm:w-48">
        <Select
          value={searchParams.get('sortBy') || ''}
          onChange={(e) => createQueryString('sortBy', e.target.value)}
          className="w-full"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="score_high">Highest Score</option>
          <option value="score_low">Lowest Score</option>
        </Select>
      </div>
    </div>
  );
}
