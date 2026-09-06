'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseUrl, getPublicSupabaseAnonKey } from './env';

export function createClient() {
  return createBrowserClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey()
  );
}
