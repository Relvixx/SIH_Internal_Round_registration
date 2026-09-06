-- Migration 00004: Phase 2 Production Fixes
-- Description: Implement true atomic transactions, standardize storage, and fix security issues

-- ==============================================================================
-- 1. STORAGE: Standardize on 'team-submissions' bucket
-- ==============================================================================

-- Create team-submissions if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-submissions', 
    'team-submissions', 
    false, -- Private bucket
    52428800, -- 50MB (will be overridden by event_settings at signed-url generation)
    '{"application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"}'
) ON CONFLICT (id) DO NOTHING;

-- Drop old submissions bucket policies if they exist (clean up Phase 2 initial pass)
DROP POLICY IF EXISTS "Admins can view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Service Role can insert submissions" ON storage.objects;
DROP POLICY IF EXISTS "Service Role can update submissions" ON storage.objects;
DROP POLICY IF EXISTS "Service Role can delete submissions" ON storage.objects;

-- Remove old 'submissions' bucket if empty and safely possible (we just leave it alone or delete if it's safe)
-- We will just focus on policies for team-submissions

-- Only Service Role or authenticated admins can read
CREATE POLICY "Admins can view team-submissions" ON storage.objects
FOR SELECT USING (
    bucket_id = 'team-submissions' AND 
    (
        auth.role() = 'service_role' OR 
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    )
);

-- Only Service Role can insert/update (backend will generate signed urls with Service Role)
CREATE POLICY "Service Role can insert team-submissions" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'team-submissions' AND auth.role() = 'service_role'
);

CREATE POLICY "Service Role can update team-submissions" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'team-submissions' AND auth.role() = 'service_role'
);

CREATE POLICY "Service Role can delete team-submissions" ON storage.objects
FOR DELETE USING (
    bucket_id = 'team-submissions' AND auth.role() = 'service_role'
);


-- ==============================================================================
-- 2. IDEMPOTENCY
-- ==============================================================================
CREATE TABLE registration_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. TRUE ATOMIC TRANSACTIONS (RPCs)
-- ==============================================================================

-- Type for returning from RPCs cleanly
DROP TYPE IF EXISTS rpc_registration_result CASCADE;
CREATE TYPE rpc_registration_result AS (
    team_id UUID,
    registration_code TEXT
);

CREATE OR REPLACE FUNCTION register_team_transaction(
    p_idempotency_key TEXT,
    p_idea_title TEXT,
    p_idea_description TEXT,
    p_problem_statement_id UUID,
    p_edit_token_hash TEXT,
    p_members JSONB,
    p_file_path TEXT,
    p_file_name TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT
) RETURNS rpc_registration_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
    v_registration_code TEXT;
    v_member JSONB;
    v_result rpc_registration_result;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT team_id INTO v_team_id FROM registration_idempotency WHERE idempotency_key = p_idempotency_key;
        IF v_team_id IS NOT NULL THEN
            -- Return existing team
            SELECT id, registration_code INTO v_result.team_id, v_result.registration_code FROM teams WHERE id = v_team_id;
            RETURN v_result;
        END IF;
    END IF;

    -- 1. Insert Team
    INSERT INTO teams (
        idea_title, idea_description, problem_statement_id, status, edit_token_hash
    ) VALUES (
        p_idea_title, p_idea_description, p_problem_statement_id, 'submitted', p_edit_token_hash
    ) RETURNING id, registration_code INTO v_team_id, v_registration_code;

    -- 2. Insert Members
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO team_members (
            team_id, role, first_name, last_name, email, phone, gender, year_of_study, department
        ) VALUES (
            v_team_id,
            (v_member->>'role')::team_role,
            v_member->>'first_name',
            v_member->>'last_name',
            v_member->>'email',
            v_member->>'phone',
            (v_member->>'gender')::gender,
            v_member->>'year_of_study',
            v_member->>'department'
        );
    END LOOP;

    -- 3. Insert File Metadata
    INSERT INTO submission_files (
        team_id, file_type, storage_path, file_name, file_size_bytes, mime_type
    ) VALUES (
        v_team_id, 'presentation', p_file_path, p_file_name, p_file_size, p_mime_type
    );

    -- 4. Record Idempotency Key
    IF p_idempotency_key IS NOT NULL THEN
        INSERT INTO registration_idempotency (idempotency_key, team_id) VALUES (p_idempotency_key, v_team_id);
    END IF;

    -- 5. Audit Log
    INSERT INTO audit_logs (
        action, team_id, details
    ) VALUES (
        'team_submitted', v_team_id, jsonb_build_object('registration_code', v_registration_code, 'problem_statement_id', p_problem_statement_id)
    );

    v_result.team_id := v_team_id;
    v_result.registration_code := v_registration_code;
    RETURN v_result;
END;
$$;


CREATE OR REPLACE FUNCTION edit_team_transaction(
    p_team_id UUID,
    p_edit_token_hash TEXT,
    p_idea_title TEXT,
    p_idea_description TEXT,
    p_problem_statement_id UUID,
    p_members JSONB,
    p_file_path TEXT,
    p_file_name TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_hash TEXT;
    v_member JSONB;
BEGIN
    -- 1. Verify Authorization (Token Hash)
    SELECT edit_token_hash INTO v_current_hash FROM teams WHERE id = p_team_id;
    
    IF v_current_hash IS NULL OR v_current_hash != p_edit_token_hash THEN
        RAISE EXCEPTION 'Unauthorized: Invalid edit token';
    END IF;

    -- 2. Update Team
    UPDATE teams SET
        idea_title = p_idea_title,
        idea_description = p_idea_description,
        problem_statement_id = p_problem_statement_id,
        last_edited_at = NOW()
    WHERE id = p_team_id;

    -- 3. Replace Members
    DELETE FROM team_members WHERE team_id = p_team_id;

    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO team_members (
            team_id, role, first_name, last_name, email, phone, gender, year_of_study, department
        ) VALUES (
            p_team_id,
            (v_member->>'role')::team_role,
            v_member->>'first_name',
            v_member->>'last_name',
            v_member->>'email',
            v_member->>'phone',
            (v_member->>'gender')::gender,
            v_member->>'year_of_study',
            v_member->>'department'
        );
    END LOOP;

    -- 4. Replace Presentation (if provided)
    IF p_file_path IS NOT NULL AND p_file_path != '' THEN
        -- We just insert a new file metadata. Or update the existing one.
        -- We will update the existing 'presentation' file record
        UPDATE submission_files SET
            storage_path = p_file_path,
            file_name = p_file_name,
            file_size_bytes = p_file_size,
            mime_type = p_mime_type,
            uploaded_at = NOW()
        WHERE team_id = p_team_id AND file_type = 'presentation';
        
        -- If no previous presentation found, insert it
        IF NOT FOUND THEN
            INSERT INTO submission_files (
                team_id, file_type, storage_path, file_name, file_size_bytes, mime_type
            ) VALUES (
                p_team_id, 'presentation', p_file_path, p_file_name, p_file_size, p_mime_type
            );
        END IF;
    END IF;

    -- 5. Audit Logs
    INSERT INTO audit_logs (
        action, team_id, details
    ) VALUES (
        'team_edited', p_team_id, jsonb_build_object('problem_statement_id', p_problem_statement_id)
    );

    IF p_file_path IS NOT NULL AND p_file_path != '' THEN
        INSERT INTO audit_logs (
            action, team_id, details
        ) VALUES (
            'presentation_replaced', p_team_id, jsonb_build_object('file_name', p_file_name, 'file_size', p_file_size)
        );
    END IF;

    RETURN TRUE;
END;
$$;
