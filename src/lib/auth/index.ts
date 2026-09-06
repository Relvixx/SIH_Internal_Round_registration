import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AdminUser } from '@/types';

/**
 * Server-side only: Gets the current session user.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Server-side only: Requires an authenticated admin session.
 * Redirects to login if unauthenticated.
 * Redirects to unauthorized if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<{ userId: string; role: string }> {
  const user = await getSession();

  if (!user) {
    redirect('/admin/login');
  }

  const supabase = await createClient();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!adminUser || adminUser.role !== 'super_admin') {
    redirect('/admin/login?error=unauthorized');
  }

  // Enforce super_admin rule if needed, or return role
  return { userId: adminUser.id, role: adminUser.role };
}

/**
 * Server-side only: Checks if a user ID belongs to an admin.
 */
export async function isAuthorizedAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();

  return !!data;
}
