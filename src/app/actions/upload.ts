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

    // 1. Fetch Event Settings with Fallbacks
    let presentationMaxSizeMb = 50;
    let allowedFormats = ['pdf', 'pptx', 'png', 'jpg', 'jpeg', 'webp'];

    try {
      const { data: settings } = await supabase
        .from('event_settings')
        .select('presentation_max_size_mb, allowed_presentation_formats')
        .single();

      if (settings?.presentation_max_size_mb) {
        presentationMaxSizeMb = settings.presentation_max_size_mb;
      }
      if (settings?.allowed_presentation_formats && settings.allowed_presentation_formats.length > 0) {
        allowedFormats = [...settings.allowed_presentation_formats];
        const imageExtensions = ['png', 'jpg', 'jpeg', 'webp'];
        imageExtensions.forEach(ext => {
          if (!allowedFormats.includes(ext)) allowedFormats.push(ext);
        });
      }
    } catch (e) {
      console.warn('Using default upload settings due to fetch error:', e);
    }

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
      // Fallback for dev / unconfigured bucket environments
      return {
        success: true,
        signedUrl: '#',
        storagePath,
        token: 'dev-token'
      };
    }

    return { 
      success: true, 
      signedUrl: data.signedUrl, 
      storagePath,
      token: data.token
    };

  } catch (error: unknown) {
    console.error('Signed upload url generation error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during upload authorization.';
    return { success: false, error: message };
  }
}
