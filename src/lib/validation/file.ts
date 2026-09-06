import { sanitizeFilename } from '@/lib/security';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const MIME_TYPE_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.pptx': [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  '.ppt': ['application/vnd.ms-powerpoint'],
};

/**
 * Validates a file against configured constraints.
 * Checks: size, MIME type, extension match, non-empty.
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  options: {
    maxSizeMb: number;
    allowedFormats: string[]; // e.g. ['.pdf', '.pptx']
  }
): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: 'The file is empty.' };
  }

  const maxBytes = options.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the ${options.maxSizeMb} MB limit.`,
    };
  }

  const ext = getExtension(file.name);
  if (!ext || !options.allowedFormats.includes(ext)) {
    return {
      valid: false,
      error: `File type "${ext || 'unknown'}" is not allowed. Accepted: ${options.allowedFormats.join(', ')}`,
    };
  }

  const allowedMimes = MIME_TYPE_MAP[ext];
  if (allowedMimes && !allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File content does not match the expected format for ${ext} files.`,
    };
  }

  return { valid: true };
}

function getExtension(filename: string): string | null {
  const match = filename.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Builds a safe storage path for team submissions.
 */
export function buildSubmissionPath(
  teamId: string,
  fileKind: string,
  filename: string,
  version: number
): string {
  const safe = sanitizeFilename(filename);
  return `${teamId}/${fileKind}/v${version}_${safe}`;
}

/**
 * Builds the storage path for the event PPT template.
 */
export function buildTemplatePath(filename: string, version: number): string {
  const safe = sanitizeFilename(filename);
  return `templates/v${version}_${safe}`;
}
