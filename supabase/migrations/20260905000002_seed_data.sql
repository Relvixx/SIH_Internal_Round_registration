-- Migration 00002: Seed Data for SIH Internal Hackathon Portal
-- Description: Default event settings, problem statements, and evaluation criteria

-- 1. Seed Event Settings
INSERT INTO event_settings (
    event_name,
    event_year,
    institute_name,
    registration_open,
    editing_enabled,
    minimum_team_size,
    maximum_team_size,
    minimum_female_members,
    presentation_max_size_mb,
    allowed_presentation_formats
) VALUES (
    'Smart India Hackathon Internal Round',
    2026,
    'MET BKC – Institute of Technology Polytechnic',
    false, -- Closed by default until admin opens it
    false,
    6,
    6,
    2,
    50,
    '["pdf", "pptx"]'::jsonb
);

-- 2. Seed Default Evaluation Criteria
INSERT INTO evaluation_criteria (name, description, max_score, weight) VALUES
    ('Innovation and Novelty', 'How unique and innovative is the proposed solution compared to existing ones?', 10, 1.0),
    ('Problem Understanding', 'Has the team clearly understood the root cause and nuances of the problem statement?', 10, 1.0),
    ('Technical Approach', 'Is the technical architecture, technology stack, and approach sound and modern?', 10, 1.0),
    ('Feasibility and Practicability', 'Can this solution actually be built and deployed in the real world within a reasonable timeframe?', 10, 1.0),
    ('Impact and Scalability', 'What is the potential impact of the solution? Can it scale to handle a large user base or broad deployment?', 10, 1.0),
    ('Presentation and Clarity', 'How well did the team articulate their idea, present the slides, and answer questions?', 10, 1.0);

-- 3. Storage Buckets (requires inserting into storage.buckets and storage.policies)
-- Note: In a real Supabase setup, this is best done via the Dashboard or Storage API,
-- but we can initialize the basic structure here.

INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-assets', 'event-assets', true),
  ('team-submissions', 'team-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'event-assets' (Public Read, Admin Write)
INSERT INTO storage.policies (name, bucket_id, definition, check_definition) 
VALUES 
  ('Public can read event assets', 'event-assets', 'true', null),
  ('Admins can upload event assets', 'event-assets', '(SELECT is_admin())', '(SELECT is_admin())'),
  ('Admins can update event assets', 'event-assets', '(SELECT is_admin())', '(SELECT is_admin())'),
  ('Admins can delete event assets', 'event-assets', '(SELECT is_admin())', null)
ON CONFLICT DO NOTHING;

-- Storage Policies for 'team-submissions' (Admin Read/Write, Service Role used for uploads)
-- Since team submissions are uploaded via Service Role, we only need to give Admins read/delete access via RLS
INSERT INTO storage.policies (name, bucket_id, definition, check_definition) 
VALUES 
  ('Admins can read submissions', 'team-submissions', '(SELECT is_admin())', null),
  ('Admins can delete submissions', 'team-submissions', '(SELECT is_admin())', null)
ON CONFLICT DO NOTHING;
