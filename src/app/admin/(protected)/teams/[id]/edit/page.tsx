import { Metadata } from 'next';
import { getAdminTeamDetail } from '@/lib/services/admin-teams';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TeamEditForm } from '@/components/admin/team-edit-form';

export const metadata: Metadata = { title: 'Edit Team Registration' };

export default async function AdminTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let team, members, problemStatements, eventSettings;

  try {
    const detail = await getAdminTeamDetail(resolvedParams.id);
    team = detail.team;
    members = detail.members;

    const supabase = createAdminClient();
    const psRes = await supabase
      .from('problem_statements')
      .select('id, ps_id, title')
      .order('ps_id', { ascending: true });
    
    problemStatements = psRes.data || [];

    const settingsRes = await supabase
      .from('event_settings')
      .select('minimum_team_size, maximum_team_size, minimum_female_members')
      .single();

    eventSettings = settingsRes.data || { minimum_team_size: 3, maximum_team_size: 6, minimum_female_members: 1 };

  } catch (error) {
    console.error('Failed to load team for edit:', error);
    notFound();
  }

  // Map to TeamRegistrationInput format
  const initialData = {
    team_name: team.registration_code || '',
    idea_title: team.idea_title || '',
    problem_statement_id: team.problem_statement_id || '',
    solution_summary: team.idea_description || '',
    members: members.map((m: any, i: number) => ({
      member_order: i + 1,
      role: m.role,
      full_name: `${m.first_name} ${m.last_name}`,
      gender: m.gender,
      email: m.email,
      phone: m.phone,
      department: m.department,
      year_or_semester: m.year_of_study,
      enrollment_number: '',
    }))
  };

  return (
    <div className="pb-10">
      <TeamEditForm 
        teamId={resolvedParams.id} 
        initialData={initialData} 
        problemStatements={problemStatements} 
        minTeamSize={1}
        maxTeamSize={6}
        minFemale={0}
      />
    </div>
  );
}
