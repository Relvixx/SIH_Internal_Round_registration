import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { RegistrationWizard } from '@/components/wizard/registration-wizard';
import { createAdminClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Register Your Team',
  description: 'Register your team for the SIH Internal Hackathon at MET BKC Polytechnic.',
};

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const supabase = createAdminClient();
  const { data: problemStatements } = await supabase
    .from('problem_statements')
    .select('id, ps_id, title, category, theme, organization')
    .eq('is_active', true)
    .order('ps_id', { ascending: true });

  const { data: eventSettings } = await supabase
    .from('event_settings')
    .select('registration_open')
    .single();

  const isRegistrationOpen = eventSettings?.registration_open ?? true; // Fallback to true if not set

  return (
    <div className="container-page py-8 md:py-12">
      <PageHeader
        title="Register Your Team"
        description="Complete the registration form to participate in the SIH Internal Hackathon."
      />
      {!isRegistrationOpen ? (
        <div className="max-w-2xl mx-auto">
          <EmptyState
            icon={<ClipboardList className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="Registration Closed"
            description="The registration period is currently closed. Please check the rules or contact administration."
            action={
              <Link href="/rules">
                <Button variant="secondary">View Rules & Guidelines</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <RegistrationWizard problemStatements={problemStatements || []} />
      )}
    </div>
  );
}
