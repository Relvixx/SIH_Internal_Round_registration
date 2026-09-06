'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { evaluationCriterionSchema } from '@/lib/validation/schemas';

// --- Evaluation Criteria CRUD ---

export async function addEvaluationCriterion(data: z.infer<typeof evaluationCriterionSchema>) {
  const supabase = createAdminClient();
  const parsed = evaluationCriterionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('evaluation_criteria').insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    max_score: parsed.data.max_score,
    weight: parsed.data.weight,
    is_active: parsed.data.is_active
  });

  if (error) return { success: false, error: 'Failed to add criterion' };

  await supabase.from('audit_logs').insert({
    action: 'evaluation_criterion_created',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'evaluation_criteria',
    metadata: { name: parsed.data.name }
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function updateEvaluationCriterion(id: string, data: z.infer<typeof evaluationCriterionSchema>) {
  const supabase = createAdminClient();
  const parsed = evaluationCriterionSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('evaluation_criteria').update({
    name: parsed.data.name,
    description: parsed.data.description || null,
    max_score: parsed.data.max_score,
    weight: parsed.data.weight,
    is_active: parsed.data.is_active
  }).eq('id', id);

  if (error) return { success: false, error: 'Failed to update criterion' };

  await supabase.from('audit_logs').insert({
    action: 'evaluation_criterion_updated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'evaluation_criteria',
    entity_id: id,
    metadata: { name: parsed.data.name, is_active: parsed.data.is_active }
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

// --- Team Evaluations ---

export const saveTeamEvaluationsSchema = z.object({
  team_id: z.string().uuid(),
  evaluations: z.array(z.object({
    criteria_id: z.string().uuid(),
    score: z.number().int().min(0),
    comment: z.string().optional()
  }))
});

export async function saveTeamEvaluations(data: z.infer<typeof saveTeamEvaluationsSchema>) {
  const supabase = createAdminClient();
  const parsed = saveTeamEvaluationsSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Invalid data' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Call the secure RPC to validate, insert, and calculate authoritative total
  const teamId = parsed.data.team_id;
  const evals = parsed.data.evaluations;
  const { data: rpcSuccess, error: rpcError } = await supabase.rpc('save_team_evaluations_transaction', {
    p_team_id: teamId,
    p_evaluator_id: user.id,
    p_evaluations: evals
  });

  if (rpcError || !rpcSuccess) {
    console.error('RPC Error:', rpcError);
    return { success: false, error: 'Failed to save evaluations securely' };
  }

  // Insert audit log for the evaluation action
  await supabase.from('audit_logs').insert({
    action: 'team_evaluated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    entity_id: teamId,
    metadata: { count: evals.length }
  });

  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath('/admin/evaluations');
  return { success: true };
}
