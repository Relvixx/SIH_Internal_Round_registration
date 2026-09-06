'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { eventSettingsSchema } from '@/lib/validation/schemas';
import { mapErrorToUserMessage } from '@/lib/security';
import { buildTemplatePath } from '@/lib/validation/file';
import { STORAGE_BUCKETS } from '@/lib/constants';
import type { ActionResult, EventSettings } from '@/types';

export async function getEventSettings(): Promise<EventSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) return null;
  return data as EventSettings;
}

export async function updateEventSettings(formData: FormData): Promise<ActionResult> {
  const { userId } = await requireAdmin();

  const raw = {
    event_name: formData.get('event_name') as string,
    event_year: Number(formData.get('event_year')),
    institute_name: formData.get('institute_name') as string,
    registration_open: formData.get('registration_open') === 'true',
    registration_deadline: (formData.get('registration_deadline') as string) || null,
    editing_enabled: formData.get('editing_enabled') === 'true',
    minimum_team_size: Number(formData.get('minimum_team_size')),
    maximum_team_size: Number(formData.get('maximum_team_size')),
    minimum_female_members: Number(formData.get('minimum_female_members')),
    presentation_max_size_mb: Number(formData.get('presentation_max_size_mb')),
    allowed_presentation_formats: JSON.parse(formData.get('allowed_presentation_formats') as string || '[]'),
    template_title: (formData.get('template_title') as string) || null,
    template_instructions: (formData.get('template_instructions') as string) || null,
  };

  const parsed = eventSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, message: firstError?.message || 'Validation failed.' };
  }

  try {
    const supabase = await createClient();

    // Get existing settings ID
    const { data: existing } = await supabase
      .from('event_settings')
      .select('id, registration_open, minimum_team_size, maximum_team_size, minimum_female_members')
      .limit(1)
      .single();

    if (!existing) {
      return { success: false, message: 'Event settings not found.' };
    }

    const { error } = await supabase
      .from('event_settings')
      .update(parsed.data)
      .eq('id', existing.id);

    if (error) {
      return { success: false, message: mapErrorToUserMessage(error) };
    }

    // Audit log important changes
    const adminClient = createAdminClient();
    const changes: Record<string, unknown> = {};
    if (existing.registration_open !== parsed.data.registration_open) {
      changes.registration_open = { from: existing.registration_open, to: parsed.data.registration_open };
    }
    if (existing.minimum_team_size !== parsed.data.minimum_team_size) {
      changes.minimum_team_size = { from: existing.minimum_team_size, to: parsed.data.minimum_team_size };
    }
    if (existing.maximum_team_size !== parsed.data.maximum_team_size) {
      changes.maximum_team_size = { from: existing.maximum_team_size, to: parsed.data.maximum_team_size };
    }
    if (existing.minimum_female_members !== parsed.data.minimum_female_members) {
      changes.minimum_female_members = { from: existing.minimum_female_members, to: parsed.data.minimum_female_members };
    }

    if (Object.keys(changes).length > 0) {
      await adminClient.from('audit_logs').insert({
        actor_type: 'admin',
        actor_id: userId,
        action: 'settings_updated',
        entity_type: 'event_settings',
        entity_id: existing.id,
        metadata: changes,
      });
    }

    return { success: true, message: 'Settings saved successfully.' };
  } catch (err) {
    return { success: false, message: mapErrorToUserMessage(err) };
  }
}

export async function uploadTemplate(formData: FormData): Promise<ActionResult> {
  const { userId } = await requireAdmin();

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, message: 'No file selected.' };
  }

  const title = (formData.get('template_title') as string) || file.name;

  // Validate file
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ];
  if (!allowedMimes.includes(file.type)) {
    return { success: false, message: 'Only PDF and PPTX files are accepted as templates.' };
  }
  const maxSizeMb = 50;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { success: false, message: `File size exceeds ${maxSizeMb} MB limit.` };
  }

  try {
    const supabase = await createClient();

    // Get current settings
    const { data: settings } = await supabase
      .from('event_settings')
      .select('id, template_version')
      .limit(1)
      .single();

    if (!settings) {
      return { success: false, message: 'Event settings not found.' };
    }

    const newVersion = (settings.template_version || 0) + 1;
    const storagePath = buildTemplatePath(file.name, newVersion);

    // Upload to public event-assets bucket
    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from(STORAGE_BUCKETS.EVENT_ASSETS)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, message: 'Failed to upload template file. Please try again.' };
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('event_settings')
      .update({
        template_title: title,
        template_storage_path: storagePath,
        template_version: newVersion,
      })
      .eq('id', settings.id);

    if (updateError) {
      return { success: false, message: mapErrorToUserMessage(updateError) };
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      actor_type: 'admin',
      actor_id: userId,
      action: newVersion > 1 ? 'template_replaced' : 'template_uploaded',
      entity_type: 'event_settings',
      entity_id: settings.id,
      metadata: { filename: file.name, version: newVersion, size_bytes: file.size },
    });

    return { success: true, message: `Template uploaded successfully (v${newVersion}).` };
  } catch (err) {
    return { success: false, message: mapErrorToUserMessage(err) };
  }
}
