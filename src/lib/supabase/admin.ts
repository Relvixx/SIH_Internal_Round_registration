import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseUrl, getServiceRoleKey } from './env';

/**
 * Service-role client for privileged server-side operations only.
 * NEVER import this in client components or expose the service role key.
 * Used for: admin user verification, audit logging, storage operations
 * that require bypassing RLS.
 */
export function createAdminClient() {
  return createSupabaseClient(
    getPublicSupabaseUrl(),
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
