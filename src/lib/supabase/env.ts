const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const serverOnlyEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validatePublicEnv() {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nCopy .env.example to .env.local and fill in your Supabase credentials.`
    );
  }
}

export function validateServerEnv() {
  validatePublicEnv();
  const missing: string[] = [];
  for (const key of serverOnlyEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing server environment variables:\n${missing.join('\n')}\n\nThese are required for server-side operations.`
    );
  }
}

export function getPublicSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  return url;
}

export function getPublicSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  return key;
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return key;
}
