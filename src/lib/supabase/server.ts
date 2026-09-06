import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseUrl, getPublicSupabaseAnonKey, getServiceRoleKey } from './env';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies; this is expected
            // when called from a Server Component context
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    getPublicSupabaseUrl(),
    getServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}
