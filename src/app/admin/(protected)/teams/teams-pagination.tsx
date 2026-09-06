'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/ui/table';

export function TeamsPagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
