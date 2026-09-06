import type { TeamStatus, MemberRole, Gender, ProblemType, AdminRole, FileKind, AuditAction } from '@/lib/constants';

// ── Event Settings ──
export interface EventSettings {
  id: string;
  event_name: string;
  event_year: number;
  institute_name: string;
  registration_open: boolean;
  registration_deadline: string | null;
  editing_enabled: boolean;
  minimum_team_size: number;
  maximum_team_size: number;
  minimum_female_members: number;
  presentation_max_size_mb: number;
  allowed_presentation_formats: string[];
  template_title: string | null;
  template_storage_path: string | null;
  template_version: number;
  template_instructions: string | null;
  created_at: string;
  updated_at: string;
}

// ── Problem Statement ──
export interface ProblemStatement {
  id: string;
  ps_id: string;
  title: string;
  organization: string;
  theme: string | null;
  category: string | null;
  problem_type: ProblemType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Team ──
export interface Team {
  id: string;
  registration_code: string | null;
  team_name: string | null;
  problem_statement_id: string | null;
  idea_title: string | null;
  solution_summary: string | null;
  key_innovation: string | null;
  proposed_technology: string | null;
  status: TeamStatus;
  edit_token_hash: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
  problem_statement?: ProblemStatement | null;
}

// ── Team Member ──
export interface TeamMember {
  id: string;
  team_id: string;
  member_order: number;
  role: MemberRole;
  full_name: string;
  gender: Gender;
  enrollment_number: string | null;
  department: string | null;
  year_or_semester: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ── Submission File ──
export interface SubmissionFile {
  id: string;
  team_id: string;
  file_kind: FileKind;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  is_current: boolean;
  uploaded_at: string;
}

// ── Evaluation ──
export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string | null;
  max_score: number;
  weight: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamEvaluation {
  id: string;
  team_id: string;
  criterion_id: string;
  score: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// ── Admin ──
export interface AdminUser {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

export interface AdminNote {
  id: string;
  team_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// ── Audit ──
export interface AuditLog {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ── UI Helpers ──
export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}
