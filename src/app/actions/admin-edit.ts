'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { teamRegistrationSchema, TeamRegistrationInput } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function adminUpdateTeam(teamId: string, data: TeamRegistrationInput) {
  const supabase = createAdminClient();
  const parsed = teamRegistrationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data' };
  }

  const payload = parsed.data;

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // 1. Update team details
    const { error: teamError } = await supabase.from('teams').update({
      idea_title: payload.idea_title || '',
      idea_description: payload.solution_summary,
      problem_statement_id: payload.problem_statement_id || null,
      updated_at: new Date().toISOString()
    }).eq('id', teamId);

    if (teamError) {
      console.error('Update team error:', teamError);
      return { success: false, error: 'Failed to update team details.' };
    }

    // 2. Delete existing members
    const { error: deleteMembersError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    if (deleteMembersError) {
      console.error('Delete members error:', deleteMembersError);
      return { success: false, error: 'Failed to update team members (deletion step).' };
    }

    // 3. Insert new members
    const membersData = payload.members.map((m) => ({
      team_id: teamId,
      first_name: m.full_name.split(' ')[0],
      last_name: m.full_name.split(' ').slice(1).join(' '),
      email: m.email.toLowerCase(),
      phone: m.phone,
      gender: m.gender,
      role: m.role,
      department: m.department,
      year_of_study: m.year_or_semester,
    }));

    const { error: insertMembersError } = await supabase
      .from('team_members')
      .insert(membersData);

    if (insertMembersError) {
      console.error('Insert members error:', insertMembersError);
      return { success: false, error: 'Failed to insert updated team members.' };
    }

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      action: 'team_edited',
      actor_type: 'admin',
      actor_id: user.id,
      entity_type: 'teams',
      entity_id: teamId,
      metadata: {
        updated_fields: ['idea_title', 'idea_description', 'problem_statement_id', 'members']
      }
    });

    revalidatePath(`/admin/teams`);
    revalidatePath(`/admin/teams/${teamId}`);
    return { success: true };

  } catch (err: any) {
    console.error('Admin update team exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
