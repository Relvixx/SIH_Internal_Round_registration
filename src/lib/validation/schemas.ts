import { z } from 'zod';
import { MEMBER_ROLES, GENDERS, PROBLEM_TYPES } from '@/lib/constants';

// ── Admin Login ──
export const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ── Event Settings ──
export const eventSettingsSchema = z.object({
  event_name: z.string().min(1, 'Event name is required').max(200),
  event_year: z.coerce.number().int().min(2024, 'Year must be 2024 or later').max(2100),
  institute_name: z.string().min(1, 'Institute name is required').max(300),
  registration_open: z.boolean(),
  registration_deadline: z.string().nullable(),
  editing_enabled: z.boolean(),
  minimum_team_size: z.coerce.number().int().min(1, 'Must be at least 1').max(20),
  maximum_team_size: z.coerce.number().int().min(1, 'Must be at least 1').max(20),
  minimum_female_members: z.coerce.number().int().min(0, 'Cannot be negative').max(20),
  presentation_max_size_mb: z.coerce.number().min(1, 'Must be at least 1 MB').max(100),
  allowed_presentation_formats: z.array(z.string()).min(1, 'At least one format is required'),
  template_title: z.string().max(200).nullable(),
  template_instructions: z.string().max(2000).nullable(),
}).refine(
  (data) => data.minimum_team_size <= data.maximum_team_size,
  { message: 'Minimum team size cannot exceed maximum', path: ['minimum_team_size'] }
).refine(
  (data) => data.minimum_female_members <= data.maximum_team_size,
  { message: 'Minimum female members cannot exceed maximum team size', path: ['minimum_female_members'] }
);
export type EventSettingsInput = z.infer<typeof eventSettingsSchema>;

// ── Problem Statement ──
export const problemStatementSchema = z.object({
  ps_id: z.string().min(1, 'Problem Statement ID is required').max(50),
  title: z.string().min(1, 'Title is required').max(500),
  organization: z.string().min(1, 'Organization is required').max(300),
  theme: z.string().max(200).nullable(),
  category: z.string().max(200).nullable(),
  problem_type: z.enum(PROBLEM_TYPES),
  description: z.string().max(5000).nullable(),
  is_active: z.boolean(),
});
export type ProblemStatementInput = z.infer<typeof problemStatementSchema>;

// ── Team Member ──
export const teamMemberSchema = z.object({
  member_order: z.coerce.number().int().min(1).max(20),
  role: z.enum(MEMBER_ROLES),
  full_name: z.string().min(1, 'Full name is required').max(200),
  gender: z.enum(GENDERS),
  enrollment_number: z.string().max(50).nullable(),
  department: z.string().min(1, 'Branch is required').max(200),
  year_or_semester: z.string().min(1, 'Year is required').max(50),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(1, 'Phone is required').max(20),
});
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

// ── Team Registration ──
export const teamRegistrationSchema = z.object({
  team_name: z.string().min(1, 'Team name is required').max(200),
  problem_statement_id: z.string().optional(),
  idea_title: z.string().optional(),
  solution_summary: z.string().min(1, 'Problem statement and solution description is required').max(5000),
  key_innovation: z.string().max(1000).optional().nullable(),
  proposed_technology: z.string().max(1000).optional().nullable(),
  members: z.array(teamMemberSchema)
    .min(3, 'A team must have at least 3 members.')
    .max(6, 'A team cannot have more than 6 members.'),
}).refine(
  (data) => data.members.filter((m) => m.gender === 'female').length >= 1,
  { message: 'Your team must include at least 1 female member to proceed.', path: ['members'] }
);
export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>;

// ── File Metadata ──
export const fileMetadataSchema = z.object({
  original_filename: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
});
export type FileMetadataInput = z.infer<typeof fileMetadataSchema>;

// ── Evaluation Criterion ──
export const evaluationCriterionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).nullable(),
  max_score: z.coerce.number().min(1, 'Must be at least 1').max(100),
  weight: z.coerce.number().min(0).max(10),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});
export type EvaluationCriterionInput = z.infer<typeof evaluationCriterionSchema>;

// ── Team Evaluation Score ──
export const teamEvaluationSchema = z.object({
  team_id: z.string().uuid(),
  criterion_id: z.string().uuid(),
  score: z.coerce.number().min(0).nullable(),
  comment: z.string().max(2000).nullable(),
});
export type TeamEvaluationInput = z.infer<typeof teamEvaluationSchema>;
