'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const updateStatusSchema = z.object({
  team_id: z.string().uuid(),
  status: z.enum(['submitted', 'under_review', 'needs_correction', 'eligible', 'shortlisted', 'waitlisted', 'rejected']),
  correction_note: z.string().optional()
});

export async function updateTeamStatus(data: z.infer<typeof updateStatusSchema>) {
  const supabase = createAdminClient();
  const parsed = updateStatusSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };
  
  const { team_id, status, correction_note } = parsed.data;

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch current status
  const { data: team, error: fetchError } = await supabase.from('teams').select('status').eq('id', team_id).single();
  if (fetchError || !team) return { success: false, error: 'Team not found' };

  if (team.status === status) return { success: true }; // No change

  // Update
  const { error: updateError } = await supabase.from('teams').update({
    status,
    correction_note: status === 'needs_correction' ? correction_note : null
  }).eq('id', team_id);

  if (updateError) return { success: false, error: 'Failed to update status' };

  // Audit
  await supabase.from('audit_logs').insert({
    action: 'status_changed',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    entity_id: team_id,
    metadata: {
      from_status: team.status,
      to_status: status,
      correction_note
    }
  });

  revalidatePath(`/admin/teams`);
  revalidatePath(`/admin/teams/${team_id}`);
  return { success: true };
}

const updatePPTStatusSchema = z.object({
  team_id: z.string().uuid(),
  ppt_review_status: z.enum(['not_reviewed', 'verified', 'needs_correction']),
  ppt_review_note: z.string().optional()
});

export async function updatePPTReviewStatus(data: z.infer<typeof updatePPTStatusSchema>) {
  const supabase = createAdminClient();
  const parsed = updatePPTStatusSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error: updateError } = await supabase.from('teams').update({
    ppt_review_status: parsed.data.ppt_review_status,
    ppt_review_note: parsed.data.ppt_review_note || null
  }).eq('id', parsed.data.team_id);

  if (updateError) return { success: false, error: 'Failed to update PPT review status' };

  await supabase.from('audit_logs').insert({
    action: 'ppt_review_updated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    entity_id: parsed.data.team_id,
    metadata: {
      ppt_review_status: parsed.data.ppt_review_status
    }
  });

  revalidatePath(`/admin/teams/${parsed.data.team_id}`);
  return { success: true };
}

export async function addAdminNote(team_id: string, note: string) {
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (!note.trim()) return { success: false, error: 'Note is empty' };

  const { error } = await supabase.from('admin_notes').insert({
    team_id,
    author_id: user.id,
    note: note.trim()
  });

  if (error) return { success: false, error: 'Failed to add note' };

  await supabase.from('audit_logs').insert({
    action: 'admin_note_added',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    entity_id: team_id,
    metadata: {}
  });

  revalidatePath(`/admin/teams/${team_id}`);
  return { success: true };
}

export async function getPresentationSignedUrl(team_id: string, path: string) {
  const supabase = createAdminClient();
  // Authorization check happens via createAdminClient and route protection
  const { data, error } = await supabase.storage.from('team-submissions').createSignedUrl(path, 3600); // 1 hour
  
  if (error || !data) return { success: false, error: 'Failed to generate signed URL' };
  
  return { success: true, url: data.signedUrl };
}
