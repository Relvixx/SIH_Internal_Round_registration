'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { TeamRegistrationInput, createTeamRegistrationSchema } from '@/lib/validation/schemas';
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

    // 2. Apply the same team rules shown to applicants.
    const minimumTeamSize = settings.minimum_team_size;
    const maximumTeamSize = settings.maximum_team_size;
    const minimumFemaleMembers = settings.minimum_female_members;
    const schema = createTeamRegistrationSchema(minimumTeamSize, maximumTeamSize, minimumFemaleMembers);
    const validatedData = schema.parse(data);

    const memberEmails = validatedData.members.map((member) => member.email.trim().toLowerCase());
    if (new Set(memberEmails).size !== memberEmails.length) {
      return { success: false, error: 'Each team member must have a unique email address.' };
    }

    // 3. Generate plain text Edit Token and hash it
    const plainTextToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(plainTextToken).digest('hex');
    
    // 4. Verify Actual Uploaded Presentation Before Finalization
    // DO NOT trust client-declared metadata. Check Supabase Storage.
    if (!/^uploads\/[0-9a-f-]{36}\.[a-z0-9]+$/i.test(fileMetadata.path)) {
      return { success: false, error: 'Invalid presentation upload. Please upload the file again.' };
    }

    const pathParts = fileMetadata.path.split('/');
    const fileName = pathParts.pop() || '';
    
    // Validate the extension against the configured event formats.
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const allowedFormats = settings.allowed_presentation_formats
      .map((format: string) => format.replace(/^\./, '').toLowerCase());
    if (!allowedFormats.includes(extension)) {
      return { success: false, error: 'Uploaded file format is not allowed.' };
    }

    if (fileMetadata.size <= 0 || fileMetadata.size > settings.presentation_max_size_mb * 1024 * 1024) {
      return { success: false, error: 'Uploaded file size is not allowed.' };
    }

    const { data: uploadedFiles, error: uploadedFilesError } = await supabase.storage
      .from('team-submissions')
      .list('uploads', { limit: 100, search: fileName });
    const uploadedFile = uploadedFiles?.find((file) => file.name === fileName);

    if (uploadedFilesError || !uploadedFile) {
      return { success: false, error: 'The presentation file was not found. Please upload it again.' };
    }

    const storedSize = Number(uploadedFile.metadata?.size);
    if (!Number.isFinite(storedSize) || storedSize !== fileMetadata.size) {
      return { success: false, error: 'The uploaded presentation could not be verified. Please upload it again.' };
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
