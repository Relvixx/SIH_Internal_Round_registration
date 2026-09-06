-- Migration 00001: Foundation Schema for SIH Internal Hackathon Portal
-- Description: Core tables, enums, triggers, and RLS policies

-- ==============================================================================
-- 1. EXTENSIONS & CUSTOM TYPES
-- ==============================================================================

-- Create custom enums for domain logic
CREATE TYPE team_status AS ENUM ('draft', 'submitted', 'needs_correction', 'approved', 'rejected');
CREATE TYPE team_role AS ENUM ('leader', 'member');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE admin_role AS ENUM ('super_admin', 'evaluator');

-- ==============================================================================
-- 2. UTILITY FUNCTIONS
-- ==============================================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 3. CORE TABLES
-- ==============================================================================

-- Admin Users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'evaluator',
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Event Settings (Singleton pattern - expecting exactly 1 row)
CREATE TABLE event_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_year INTEGER NOT NULL,
    institute_name TEXT NOT NULL,
    
    registration_open BOOLEAN NOT NULL DEFAULT false,
    registration_deadline TIMESTAMPTZ,
    editing_enabled BOOLEAN NOT NULL DEFAULT false,
    
    minimum_team_size INTEGER NOT NULL DEFAULT 6,
    maximum_team_size INTEGER NOT NULL DEFAULT 6,
    minimum_female_members INTEGER NOT NULL DEFAULT 2,
    
    presentation_max_size_mb INTEGER NOT NULL DEFAULT 50,
    allowed_presentation_formats JSONB NOT NULL DEFAULT '["pdf", "pptx"]'::jsonb,
    
    template_storage_path TEXT,
    template_title TEXT,
    template_instructions TEXT,
    template_version INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_event_settings_updated_at
    BEFORE UPDATE ON event_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Problem Statements
CREATE TABLE problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ps_id TEXT NOT NULL UNIQUE, -- e.g., 'SIH1234'
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Software', 'Hardware'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_statements_ps_id ON problem_statements(ps_id);
CREATE INDEX idx_problem_statements_theme ON problem_statements(theme);
CREATE INDEX idx_problem_statements_category ON problem_statements(category);
CREATE TRIGGER update_problem_statements_updated_at
    BEFORE UPDATE ON problem_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence for human-readable Registration Code (e.g., MET-001)
CREATE SEQUENCE registration_code_seq START 1;

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code TEXT UNIQUE, -- Generated on submission
    status team_status NOT NULL DEFAULT 'draft',
    
    idea_title TEXT NOT NULL,
    idea_description TEXT NOT NULL,
    problem_statement_id UUID REFERENCES problem_statements(id) ON DELETE RESTRICT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_ps_id ON teams(problem_statement_id);
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate Registration Code on submission
CREATE OR REPLACE FUNCTION generate_registration_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'draft' AND OLD.status = 'draft' AND NEW.registration_code IS NULL THEN
        NEW.registration_code := 'MET-' || LPAD(nextval('registration_code_seq')::TEXT, 3, '0');
        IF NEW.submitted_at IS NULL THEN
            NEW.submitted_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_generate_registration_code
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION generate_registration_code();

-- Team Members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role team_role NOT NULL,
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender gender NOT NULL,
    
    year_of_study TEXT NOT NULL,
    department TEXT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (team_id, email) -- A student can only have one role per team
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure exactly 1 leader per team
CREATE UNIQUE INDEX idx_one_leader_per_team ON team_members (team_id) WHERE role = 'leader';

-- Submission Files
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL, -- e.g., 'presentation', 'source_code'
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submission_files_team_id ON submission_files(team_id);

-- Evaluation Criteria
CREATE TABLE evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    max_score INTEGER NOT NULL,
    weight FLOAT NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_evaluation_criteria_updated_at
    BEFORE UPDATE ON evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team Evaluations
CREATE TABLE team_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
    criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE RESTRICT,
    
    score INTEGER NOT NULL,
    comments TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (team_id, evaluator_id, criteria_id)
);

CREATE INDEX idx_team_evaluations_team_id ON team_evaluations(team_id);
CREATE TRIGGER update_team_evaluations_updated_at
    BEFORE UPDATE ON team_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin Notes
CREATE TABLE admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_team_id ON admin_notes(team_id);
CREATE TRIGGER update_admin_notes_updated_at
    BEFORE UPDATE ON admin_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT NOT NULL, -- e.g., 'admin', 'system', 'team'
    actor_id UUID, -- References admin_users or teams
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- e.g., 'event_settings', 'teams'
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Helper function to check if user is an admin (any role)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE id = auth.uid()
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Policy Definitions
-- Note: Service Role (used in server actions with createAdminClient) bypasses RLS.
-- These policies apply to the Anon key and Authenticated users (via createClient).
-- ------------------------------------------------------------------------------

-- Event Settings: Anyone can read, only super admins can update (via RLS, though we mostly use Service Role for writes)
CREATE POLICY "Event settings are viewable by everyone" ON event_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can manage event settings" ON event_settings USING (is_super_admin());

-- Problem Statements: Anyone can read active ones, admins can read all and manage
CREATE POLICY "Active problem statements are viewable by everyone" ON problem_statements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all problem statements" ON problem_statements FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage problem statements" ON problem_statements USING (is_admin());

-- Teams: Public cannot access directly (submission uses Service Role), Admins can access all
CREATE POLICY "Admins can view all teams" ON teams FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage teams" ON teams USING (is_admin());

-- Team Members: Same as Teams
CREATE POLICY "Admins can view all team members" ON team_members FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage team members" ON team_members USING (is_admin());

-- Submission Files: Same as Teams
CREATE POLICY "Admins can view all submission files" ON submission_files FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage submission files" ON submission_files USING (is_admin());

-- Evaluation Criteria: Public can read active, Admins manage all
CREATE POLICY "Active evaluation criteria are viewable by everyone" ON evaluation_criteria FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all evaluation criteria" ON evaluation_criteria FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage evaluation criteria" ON evaluation_criteria USING (is_admin());

-- Team Evaluations: Only admins
CREATE POLICY "Admins can view evaluations" ON team_evaluations FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert their own evaluations" ON team_evaluations FOR INSERT WITH CHECK (evaluator_id = auth.uid());
CREATE POLICY "Admins can update their own evaluations" ON team_evaluations FOR UPDATE USING (evaluator_id = auth.uid());
CREATE POLICY "Super admins can manage all evaluations" ON team_evaluations USING (is_super_admin());

-- Admin Notes: Only admins
CREATE POLICY "Admins can view all notes" ON admin_notes FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert their own notes" ON admin_notes FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Admins can update their own notes" ON admin_notes FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Super admins can manage all notes" ON admin_notes USING (is_super_admin());

-- Audit Logs: Only super admins can read, inserts are done via Service Role
CREATE POLICY "Super admins can view audit logs" ON audit_logs FOR SELECT USING (is_super_admin());
-- Insert is allowed by Service Role only

-- Admin Users: Admins can read, only super admins can manage
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (is_admin());
CREATE POLICY "Super admins can manage admin users" ON admin_users USING (is_super_admin());

