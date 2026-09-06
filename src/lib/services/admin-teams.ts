import { createAdminClient } from '@/lib/supabase/server';

export interface AdminTeamView {
  id: string;
  registration_code: string;
  status: 'draft' | 'submitted' | 'under_review' | 'needs_correction' | 'eligible' | 'shortlisted' | 'waitlisted' | 'rejected';
  ppt_review_status: 'not_reviewed' | 'verified' | 'needs_correction';
  idea_title: string;
  idea_description: string;
  problem_statement_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  ppt_review_note: string | null;
  correction_note: string | null;
  
  problem_statement_code: string;
  problem_statement_title: string;
  problem_statement_theme: string;
  problem_statement_organization: string;
  
  total_score: number;
  evaluation_complete: boolean;
}

export interface AdminTeamMember {
  id: string;
  team_id: string;
  role: 'leader' | 'member';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  year_of_study: string;
  department: string;
  enrollment_number: string | null;
}

export interface GetTeamsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  theme?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'score_high' | 'score_low' | 'registration_code';
}

export async function getAdminTeams({
  page = 1,
  pageSize = 30,
  status,
  theme,
  search,
  sortBy = 'newest'
}: GetTeamsParams) {
  const supabase = createAdminClient();
  
  let query = supabase.from('admin_teams_view').select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (theme) {
    query = query.eq('problem_statement_theme', theme);
  }
  if (search) {
    query = query.or(`registration_code.ilike.%${search}%,idea_title.ilike.%${search}%,problem_statement_code.ilike.%${search}%,problem_statement_title.ilike.%${search}%,search_text.ilike.%${search}%`);
  }

  // Sorting
  switch (sortBy) {
    case 'newest':
      query = query.order('submitted_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('submitted_at', { ascending: true });
      break;
    case 'score_high':
      query = query.order('total_score', { ascending: false }).order('submitted_at', { ascending: true });
      break;
    case 'score_low':
      query = query.order('total_score', { ascending: true }).order('submitted_at', { ascending: true });
      break;
    case 'registration_code':
      query = query.order('registration_code', { ascending: true });
      break;
    default:
      query = query.order('submitted_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data as AdminTeamView[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

export async function getAdminTeamDetail(teamId: string) {
  const supabase = createAdminClient();
  
  const [teamResult, membersResult, filesResult] = await Promise.all([
    supabase.from('admin_teams_view').select('*').eq('id', teamId).single(),
    supabase.from('team_members').select('*').eq('team_id', teamId).order('role', { ascending: false }), // leader first
    supabase.from('submission_files').select('*').eq('team_id', teamId).eq('file_type', 'presentation').single()
  ]);

  if (teamResult.error) throw teamResult.error;

  return {
    team: teamResult.data as AdminTeamView,
    members: membersResult.data as AdminTeamMember[],
    presentation: filesResult.data || null,
  };
}

export async function getDuplicateParticipants(teamId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('participant_duplicates_view')
    .select('*')
    .eq('team_id', teamId);
    
  if (error) throw error;
  return data;
}
