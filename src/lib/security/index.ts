import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * Generates a cryptographically secure random token for edit links.
 * Returns hex-encoded string (64 chars = 32 bytes of entropy).
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash of a token for safe database storage.
 * Only the hash is stored; the raw token is sent only in the edit URL.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verifies a raw token against a stored hash using constant-time comparison.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);
  // Ensure both strings are the same length before timingSafeEqual
  if (hash.length !== storedHash.length) return false;
  return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Sanitizes a filename for safe storage.
 * Removes path traversal, special characters, preserves extension.
 */
export function sanitizeFilename(filename: string): string {
  const basename = filename.replace(/^.*[\\/]/, '');
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 200);
  return sanitized || 'unnamed_file';
}

/**
 * Maps internal/database errors to user-friendly messages.
 * Never exposes SQL errors, stack traces, or internal details.
 */
export function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('duplicate') || msg.includes('23505')) {
      return 'A record with this identifier already exists.';
    }
    if (msg.includes('foreign key') || msg.includes('23503')) {
      return 'This record references data that does not exist.';
    }
    if (msg.includes('not null') || msg.includes('23502')) {
      return 'A required field is missing.';
    }
    if (msg.includes('check constraint') || msg.includes('23514')) {
      return 'The provided values do not meet the requirements.';
    }
    if (msg.includes('permission') || msg.includes('policy') || msg.includes('42501')) {
      return 'You do not have permission to perform this action.';
    }
    if (msg.includes('timeout') || msg.includes('connection')) {
      return 'Unable to connect to the server. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}
