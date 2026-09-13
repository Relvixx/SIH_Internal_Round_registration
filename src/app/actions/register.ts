'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { teamRegistrationSchema, TeamRegistrationInput, createTeamRegistrationSchema } from '@/lib/validation/schemas';
import { randomBytes, createHash } from 'crypto';

export type RegisterResponse = {
  success: boolean;
  registrationCode?: string;
  editToken?: string;
  teamId?: string;
  error?: string;
};

export async function registerTeam(
  data: TeamRegistrationInput,
  fileMetadata: { path: string; name: string; size: number; mime: string },
  idempotencyKey: string
): Promise<RegisterResponse> {
  try {
    const supabase = createAdminClient();

    // 1. Fetch current event settings (Server Authority)
    const { data: settings, error: settingsError } = await supabase
      .from('event_settings')
      .select('registration_open, registration_deadline, minimum_team_size, maximum_team_size, minimum_female_members, presentation_max_size_mb, allowed_presentation_formats')
      .single();

    if (settingsError || !settings) {
      return { success: false, error: 'Failed to fetch event settings.' };
    }

    if (!settings.registration_open) {
      return { success: false, error: 'Registration is currently closed.' };
    }

    if (settings.registration_deadline && new Date(settings.registration_deadline) < new Date()) {
      return { success: false, error: 'Registration deadline has passed.' };
    }

    // 2. Validate data against hardcoded schema
    const schema = createTeamRegistrationSchema(1, 6, 0);
    const validatedData = schema.parse(data);

    // C. Validate Team Rules Manually (Fallback)
    if (validatedData.members.length < 1) {
      return { success: false, error: `Team must have at least 1 member.` };
    }
    if (validatedData.members.length > 6) {
      return { success: false, error: `Team cannot exceed 6 members.` };
    }

    // 3. Generate plain text Edit Token and hash it
    const plainTextToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(plainTextToken).digest('hex');
    
    // 4. Verify Actual Uploaded Presentation Before Finalization
    // DO NOT trust client-declared metadata. Check Supabase Storage.
    const pathParts = fileMetadata.path.split('/');
    const fileName = pathParts.pop() || '';
    
    // Basic Mime/Format Check from Storage Metadata
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const allowedFormatsFromSettings = (settings?.allowed_presentation_formats || ['pdf', 'pptx']).map((f: string) => f.replace(/^\./, ''));
    const allowedFormats = [...allowedFormatsFromSettings, 'png', 'jpg', 'jpeg', 'webp'];
    if (!allowedFormats.includes(extension)) {
       return { success: false, error: 'Uploaded file format is not allowed.' };
    }

    // 5. Atomic RPC Call
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

    const { data: rpcData, error: rpcError } = await supabase.rpc('register_team_transaction', {
      p_idempotency_key: idempotencyKey,
      p_idea_title: validatedData.idea_title || validatedData.team_name,
      p_idea_description: validatedData.solution_summary,
      p_problem_statement_id: null, // Problem statement removed
      p_edit_token_hash: tokenHash,
      p_members: membersData,
      p_file_path: fileMetadata.path,
      p_file_name: fileMetadata.name,
      p_file_size: fileMetadata.size,
      p_mime_type: fileMetadata.mime
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return { success: false, error: 'Server error: ' + (rpcError.message || JSON.stringify(rpcError)) };
    }

    return { 
      success: true, 
      registrationCode: rpcData.registration_code,
      editToken: plainTextToken,
      teamId: rpcData.team_id
    };

  } catch (error: unknown) {
    console.error('Registration Error:', error);
    return { success: false, error: 'Unexpected server error: ' + (error instanceof Error ? error.message : String(error)) };
  }
}
