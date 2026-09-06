// ── Team Status ──
export const TEAM_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'needs_correction',
  'eligible',
  'shortlisted',
  'waitlisted',
  'rejected',
] as const;

export type TeamStatus = (typeof TEAM_STATUSES)[number];

export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_correction: 'Needs Correction',
  eligible: 'Eligible',
  shortlisted: 'Shortlisted',
  waitlisted: 'Waitlisted',
  rejected: 'Rejected',
};

export const TEAM_STATUS_VARIANTS: Record<TeamStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'info',
  needs_correction: 'warning',
  eligible: 'success',
  shortlisted: 'success',
  waitlisted: 'warning',
  rejected: 'danger',
};

// ── Member Role ──
export const MEMBER_ROLES = ['team_leader', 'member'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  team_leader: 'Team Leader',
  member: 'Member',
};

// ── Gender ──
export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

// ── Problem Type ──
export const PROBLEM_TYPES = ['software', 'hardware'] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  software: 'Software',
  hardware: 'Hardware',
};

// ── Admin Role ──
export const ADMIN_ROLES = ['super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
};

// ── Audit Actions ──
export const AUDIT_ACTIONS = [
  'team_submitted',
  'team_edited',
  'status_changed',
  'presentation_replaced',
  'settings_updated',
  'problem_statement_created',
  'problem_statement_updated',
  'problem_statement_deleted',
  'evaluation_updated',
  'template_uploaded',
  'template_replaced',
  'admin_login',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ── File Kind ──
export const FILE_KINDS = ['presentation'] as const;
export type FileKind = (typeof FILE_KINDS)[number];

// ── Storage Buckets ──
export const STORAGE_BUCKETS = {
  EVENT_ASSETS: 'event-assets',
  TEAM_SUBMISSIONS: 'team-submissions',
} as const;

// ── Registration Code ──
export const REGISTRATION_CODE_PREFIX = 'METSIH';
