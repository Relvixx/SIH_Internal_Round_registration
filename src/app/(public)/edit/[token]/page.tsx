import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/empty-state';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Edit Submission' };

export default function EditTokenPage() {
  return (
    <div className="container-page py-16 md:py-24">
      <EmptyState
        icon={<Pencil className="h-6 w-6 text-[var(--color-ink-muted)]" />}
        title="Edit Submission"
        description="The submission editing feature is being prepared. This link will allow you to securely edit your registration."
        action={
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        }
      />
    </div>
  );
}
