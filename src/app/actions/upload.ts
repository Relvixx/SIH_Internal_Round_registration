'use server';

import { createAdminClient } from '@/lib/supabase/server';

export type SignedUploadResponse = {
  success: boolean;
  signedUrl?: string;
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

    // 1. Fetch Event Settings
    const { data: settings, error: settingsError } = await supabase
      .from('event_settings')
      .select('presentation_max_size_mb, allowed_presentation_formats')
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch event settings:', settingsError);
      return { success: false, error: 'Could not verify upload settings. Please try again later.' };
    }

    // 2. Validate File Size
    const maxSizeBytes = settings.presentation_max_size_mb * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return { success: false, error: `File exceeds maximum allowed size of ${settings.presentation_max_size_mb}MB.` };
    }

    // 3. Validate File Format
    const allowedFormats = settings.allowed_presentation_formats || [];
    // Mime mapping
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // In event settings, allowed_presentation_formats is an array like ['pdf', 'pptx']
    if (!extension || !allowedFormats.includes(extension)) {
      return { success: false, error: `Invalid file format. Allowed formats are: ${allowedFormats.join(', ')}.` };
    }

    // Additional strict MIME validation against typical pdf/pptx
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    if (!validMimes.includes(fileType)) {
      return { success: false, error: 'Invalid file MIME type.' };
    }

    // 4. Generate Storage Path
    const storagePath = `uploads/${crypto.randomUUID()}.${extension}`;

    // 5. Create Signed Upload URL using Service Role
    // This allows the browser to upload directly to this specific path in the private bucket
    const { data, error } = await supabase.storage
      .from('team-submissions')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('Failed to create signed upload url:', error);
      return { success: false, error: 'Failed to authorize upload. Please try again.' };
    }

    return { 
      success: true, 
      signedUrl: data.signedUrl, 
      storagePath,
      token: data.token // Required for client-side direct upload
    };

  } catch (error: any) {
    console.error('Signed upload url generation error:', error);
    return { success: false, error: 'An unexpected error occurred during upload authorization.' };
  }
}
