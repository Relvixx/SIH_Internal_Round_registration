'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { problemStatementSchema } from '@/lib/validation/schemas';

export async function addProblemStatement(data: z.infer<typeof problemStatementSchema>) {
  const supabase = createAdminClient();
  const parsed = problemStatementSchema.safeParse(data);
  
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('problem_statements').insert({
    ps_id: parsed.data.ps_id,
    title: parsed.data.title,
    organization: parsed.data.organization,
    theme: parsed.data.theme || '',
    category: parsed.data.category || '',
    problem_type: parsed.data.problem_type,
    description: parsed.data.description || '',
    is_active: parsed.data.is_active
  });

  if (error) {
    if (error.code === '23505') { // unique violation
      return { success: false, error: 'Problem Statement ID already exists.' };
    }
    return { success: false, error: 'Failed to add problem statement.' };
  }

  await supabase.from('audit_logs').insert({
    action: 'problem_statement_created',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'problem_statements',
    metadata: { ps_id: parsed.data.ps_id }
  });

  revalidatePath('/admin/problem-statements');
  return { success: true };
}

export async function updateProblemStatement(id: string, data: z.infer<typeof problemStatementSchema>) {
  const supabase = createAdminClient();
  const parsed = problemStatementSchema.safeParse(data);
  
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('problem_statements').update({
    ps_id: parsed.data.ps_id,
    title: parsed.data.title,
    organization: parsed.data.organization,
    theme: parsed.data.theme || '',
    category: parsed.data.category || '',
    problem_type: parsed.data.problem_type,
    description: parsed.data.description || '',
    is_active: parsed.data.is_active
  }).eq('id', id);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Problem Statement ID already exists.' };
    return { success: false, error: 'Failed to update problem statement.' };
  }

  await supabase.from('audit_logs').insert({
    action: 'problem_statement_updated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'problem_statements',
    entity_id: id,
    metadata: { ps_id: parsed.data.ps_id, is_active: parsed.data.is_active }
  });

  revalidatePath('/admin/problem-statements');
  return { success: true };
}

export async function deactivateProblemStatement(id: string) {
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('problem_statements').update({ is_active: false }).eq('id', id);
  if (error) return { success: false, error: 'Failed to deactivate problem statement.' };

  await supabase.from('audit_logs').insert({
    action: 'problem_statement_deactivated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'problem_statements',
    entity_id: id,
    metadata: {}
  });

  revalidatePath('/admin/problem-statements');
  return { success: true };
}

export async function importProblemStatements(rows: Array<Record<string, unknown>>) {
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (!rows || rows.length === 0) return { success: false, error: 'No data to import' };
  
  // Basic validation of all rows before insertion
  const validRows = [];
  for (const row of rows) {
    const parsed = problemStatementSchema.safeParse({
      ps_id: row.ps_id,
      title: row.title,
      organization: row.organization,
      theme: row.theme || '',
      category: row.category || '',
      problem_type: row.problem_type,
      description: row.description || '',
      is_active: true
    });
    if (!parsed.success) {
      return { success: false, error: `Validation failed for PS ID: ${row.ps_id || 'Unknown'}` };
    }
    validRows.push({
      ...parsed.data,
      theme: parsed.data.theme || '',
      category: parsed.data.category || '',
      description: parsed.data.description || ''
    });
  }

  // Insert all in a single query (Supabase JS handles bulk inserts transactionally)
  const { error } = await supabase.from('problem_statements').upsert(validRows, { onConflict: 'ps_id', ignoreDuplicates: true });
  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'One or more Problem Statement IDs already exist. Import aborted.' };
    }
    return { success: false, error: 'Failed to import problem statements.' };
  }

  await supabase.from('audit_logs').insert({
    action: 'problem_statements_imported',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'problem_statements',
    metadata: { row_count: validRows.length }
  });

  revalidatePath('/admin/problem-statements');
  return { success: true, count: validRows.length };
}
