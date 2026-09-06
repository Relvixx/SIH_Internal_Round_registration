'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { teamRegistrationSchema, TeamRegistrationInput } from '@/lib/validation/schemas';
import { createHash } from 'crypto';

export type EditResponse = {
  success: boolean;
  error?: string;
};

/**
 * Helper to hash a plain text token for comparison against the DB.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Validates a token against a team ID and returns the team data if valid.
 */
export async function getTeamForEdit(teamId: string, plainToken: string) {
  const supabase = createAdminClient();
  const hashedToken = hashToken(plainToken);

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      id,
      registration_code,
      idea_title,
      idea_description,
      problem_statement_id,
      status,
      edit_token_hash,
      team_members (
        id, role, first_name, last_name, email, phone, gender, year_of_study, department
      )
    `)
    .eq('id', teamId)
    .single();

  if (error || !team) {
    return { success: false, error: 'Team not found.' };
  }

  if (team.edit_token_hash !== hashedToken) {
    return { success: false, error: 'Invalid or expired edit token.' };
  }

  return { success: true, team };
}

/**
 * Updates a team's registration details.
 */
export async function updateTeam(
  teamId: string, 
  plainToken: string, 
  data: TeamRegistrationInput,
  fileMetadata?: { path: string; name: string; size: number; mime: string } | null
): Promise<EditResponse> {
  try {
    // 1. Validate data
    const validatedData = teamRegistrationSchema.parse(data);
    const supabase = createAdminClient();

    // 2. Fetch current event settings (Server Authority)
    const { data: settings, error: settingsError } = await supabase
      .from('event_settings')
      .select('editing_enabled, minimum_team_size, maximum_team_size, minimum_female_members, presentation_max_size_mb, allowed_presentation_formats')
      .single();

    if (settingsError || !settings) {
      return { success: false, error: 'Could not verify event settings. Please try again later.' };
    }

    if (!settings.editing_enabled) {
      return { success: false, error: 'Team editing is currently disabled.' };
    }

    // C. Validate Team Rules from Server Settings
    if (validatedData.members.length < settings.minimum_team_size) {
      return { success: false, error: `Team must have at least ${settings.minimum_team_size} members.` };
    }
    if (validatedData.members.length > settings.maximum_team_size) {
      return { success: false, error: `Team cannot exceed ${settings.maximum_team_size} members.` };
    }

    const femaleCount = validatedData.members.filter(m => m.gender === 'female').length;
    if (femaleCount < settings.minimum_female_members) {
      return { success: false, error: `Team must have at least ${settings.minimum_female_members} female member(s).` };
    }

    // D. Verify Problem Statement is active (if provided)
    if (validatedData.problem_statement_id) {
      const { data: psData, error: psError } = await supabase
        .from('problem_statements')
        .select('is_active')
        .eq('id', validatedData.problem_statement_id)
        .single();

      if (psError || !psData) {
        return { success: false, error: 'Invalid problem statement selected.' };
      }
      if (!psData.is_active) {
        return { success: false, error: 'The selected problem statement is no longer active.' };
      }
    }

    // Verify actual uploaded presentation if provided
    if (fileMetadata) {
      const pathParts = fileMetadata.path.split('/');
      const fileName = pathParts.pop() || '';
      
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const allowedFormatsFromSettings = (settings?.allowed_presentation_formats || ['pdf', 'pptx']).map((f: string) => f.replace(/^\./, ''));
      const allowedFormats = [...allowedFormatsFromSettings, 'png', 'jpg', 'jpeg', 'webp'];
      if (!allowedFormats.includes(extension)) {
         return { success: false, error: 'Uploaded file format is not allowed.' };
      }
    }

    const hashedToken = hashToken(plainToken);

    // 4. Atomic RPC Call
    const membersData = validatedData.members.map((member) => ({
      role: member.role === 'team_leader' ? 'leader' : 'member', // Map to DB enum
      first_name: member.full_name.split(' ')[0],
      last_name: member.full_name.split(' ').slice(1).join(' ') || '.', 
      email: member.email,
      phone: member.phone || '',
      gender: member.gender,
      year_of_study: member.year_or_semester || '',
      department: member.department || '',
      enrollment_number: member.enrollment_number || null,
    }));

    const { error: rpcError } = await supabase.rpc('edit_team_transaction', {
      p_team_id: teamId,
      p_edit_token_hash: hashedToken,
      p_idea_title: validatedData.idea_title || validatedData.team_name,
      p_idea_description: validatedData.solution_summary,
      p_problem_statement_id: validatedData.problem_statement_id || null,
      p_members: membersData,
      p_file_path: fileMetadata?.path || null,
      p_file_name: fileMetadata?.name || null,
      p_file_size: fileMetadata?.size || null,
      p_mime_type: fileMetadata?.mime || null
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      if (rpcError.message.includes('Invalid or expired edit token')) {
        return { success: false, error: 'Invalid or expired edit token.' };
      }
      return { success: false, error: 'Failed to update team details due to a server error.' };
    }

    return { success: true };

  } catch (error: unknown) {
    console.error('Edit error:', error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return { success: false, error: 'Validation failed. Please check your inputs.' };
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
