import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { RegistrationWizard } from '@/components/wizard/registration-wizard';
import { getTeamForEdit } from '@/app/actions/edit';
import { createAdminClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeamRegistrationInput } from '@/lib/validation/schemas';

export const metadata: Metadata = {
  title: 'Edit Registration',
  description: 'Edit your team registration details for the SIH Internal Hackathon.',
};

export const dynamic = 'force-dynamic';

export default async function EditPage({
  searchParams,
}: {
  searchParams: { id?: string; token?: string };
}) {
  const { id, token } = searchParams;

  if (!id || !token) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6 text-[var(--color-danger)]" />}
          title="Invalid Edit Link"
          description="Your edit link is incomplete. Please use the exact link provided on the success page."
          action={
            <Link href="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { success, team, error } = await getTeamForEdit(id, token);

  if (!success || !team) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6 text-[var(--color-danger)]" />}
          title="Access Denied"
          description={error || "We couldn't verify your edit link. It may be invalid or expired."}
          action={
            <Link href="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Fetch problem statements for the dropdown
  const supabase = createAdminClient();
  const { data: problemStatements } = await supabase
    .from('problem_statements')
    .select('id, ps_id, title, category, theme, organization')
    .eq('is_active', true)
    .order('ps_id', { ascending: true });

  // Check if editing is enabled globally
  const { data: eventSettings } = await supabase
    .from('event_settings')
    .select('editing_enabled')
    .single();

  if (eventSettings && !eventSettings.editing_enabled) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6 text-[var(--color-warning)]" />}
          title="Editing Disabled"
          description="The organizers have currently disabled editing for all submissions."
          action={
            <Link href="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Map DB data to TeamRegistrationInput for the form
  const initialData: Partial<TeamRegistrationInput> = {
    // In this schema, we don't store team_name separately, but we could use idea_title or registration_code
    // Since Phase 1 didn't have it, I'll fall back to registration_code.
    team_name: team.registration_code || '',
    problem_statement_id: team.problem_statement_id,
    idea_title: team.idea_title,
    solution_summary: team.idea_description,
    key_innovation: '', // Not saved in DB in MVP
    proposed_technology: '', // Not saved in DB in MVP
    members: (team.team_members || []).map((m: any, i: number) => ({
      member_order: i + 1,
      role: m.role,
      full_name: `${m.first_name} ${m.last_name}`,
      gender: m.gender,
      email: m.email,
      phone: m.phone,
      enrollment_number: '',
      department: m.department,
      year_or_semester: m.year_of_study,
    })),
  };

  return (
    <div className="container-page py-8 md:py-12">
      <PageHeader
        title="Edit Registration"
        description="Update your team details or idea below. You do not need to re-upload your presentation unless you want to change it."
      />
      <RegistrationWizard 
        problemStatements={problemStatements || []} 
        initialData={initialData}
        isEditMode={true}
        teamId={id}
        editToken={token}
      />
    </div>
  );
}
