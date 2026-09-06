import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Registration Successful' };

export default function SuccessPage() {
  return (
    <div className="container-page py-16 md:py-24">
      <EmptyState
        icon={<CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />}
        title="Registration Submitted"
        description="This page will display your registration details and confirmation once registration is available."
        action={
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        }
      />
    </div>
  );
}
