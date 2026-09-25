'use server';

import { createAdminClient } from '@/lib/supabase/server';

export type SignedUploadResponse = {
  success: boolean;
  storagePath?: string;
  token?: string;
  error?: string;
};

export async function getSignedUploadUrl(
  fileName: string, 
  fileType: string, 
  fileSize: number
): Promise<SignedUploadResponse> {
  try {
    const supabase = createAdminClient();

    // Upload limits are event rules, so do not fall back to more permissive values
    // when the settings query fails.
    const { data: settings, error: settingsError } = await supabase
      .from('event_settings')
      .select('presentation_max_size_mb, allowed_presentation_formats')
      .single();

    if (settingsError || !settings) {
      return { success: false, error: 'Unable to load the presentation upload requirements. Please try again.' };
    }

    const presentationMaxSizeMb = settings.presentation_max_size_mb;
    const allowedFormats = settings.allowed_presentation_formats
      .map((format: string) => format.replace(/^\./, '').toLowerCase());

    // 2. Validate File Size
    const maxSizeBytes = presentationMaxSizeMb * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return { success: false, error: `File exceeds maximum allowed size of ${presentationMaxSizeMb}MB.` };
    }

    // 3. Validate File Format
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedFormats.includes(extension)) {
      return { success: false, error: `Invalid file format. Allowed formats are: ${allowedFormats.join(', ')}.` };
    }

    // MIME type validation (supports PDF, PPTX, and standard image formats)
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];
    if (fileType && !validMimes.includes(fileType) && !fileType.startsWith('image/')) {
      return { success: false, error: 'Invalid file MIME type.' };
    }

    // 4. Generate Storage Path
    const storagePath = `uploads/${crypto.randomUUID()}.${extension}`;

    // 5. Create Signed Upload URL
    const { data, error } = await supabase.storage
      .from('team-submissions')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('Failed to create signed upload url:', error);
      return { success: false, error: 'Unable to prepare the file upload. Please try again.' };
    }

    return { 
      success: true, 
      storagePath,
      token: data.token
    };

  } catch (error: unknown) {
    console.error('Signed upload url generation error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during upload authorization.';
    return { success: false, error: message };
  }
}
