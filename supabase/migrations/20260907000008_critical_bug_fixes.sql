-- Migration 00008: Critical Bug Fixes
-- Description: 
--   1. Add missing organization column to problem_statements
--   2. Add missing sort_order column to evaluation_criteria
--   3. Recreate RPCs with correct audit_logs column names

-- 1. Add missing columns
ALTER TABLE problem_statements 
  ADD COLUMN IF NOT EXISTS organization TEXT NOT NULL DEFAULT '';

ALTER TABLE evaluation_criteria 
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. Recreate register_team_transaction with correct audit_logs
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
    IF p_idempotency_key IS NOT NULL THEN
        SELECT team_id INTO v_team_id FROM registration_idempotency WHERE idempotency_key = p_idempotency_key;
        IF v_team_id IS NOT NULL THEN
            SELECT id, registration_code INTO v_result.team_id, v_result.registration_code FROM teams WHERE id = v_team_id;
            RETURN v_result;
        END IF;
    END IF;

    INSERT INTO teams (
        idea_title, idea_description, problem_statement_id, status, edit_token_hash
    ) VALUES (
        p_idea_title, p_idea_description, p_problem_statement_id, 'submitted', p_edit_token_hash
    ) RETURNING id, registration_code INTO v_team_id, v_registration_code;

    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO team_members (
            team_id, role, first_name, last_name, email, phone, gender, year_of_study, department, enrollment_number
        ) VALUES (
            v_team_id,
            (v_member->>'role')::team_role,
            v_member->>'first_name',
            v_member->>'last_name',
            v_member->>'email',
            v_member->>'phone',
            (v_member->>'gender')::gender,
            v_member->>'year_of_study',
            v_member->>'department',
            v_member->>'enrollment_number'
        );
    END LOOP;

    INSERT INTO submission_files (
        team_id, file_type, storage_path, file_name, file_size_bytes, mime_type
    ) VALUES (
        v_team_id, 'presentation', p_file_path, p_file_name, p_file_size, p_mime_type
    );

    IF p_idempotency_key IS NOT NULL THEN
        INSERT INTO registration_idempotency (idempotency_key, team_id) VALUES (p_idempotency_key, v_team_id);
    END IF;

    INSERT INTO audit_logs (action, actor_type, entity_type, entity_id, metadata)
    VALUES ('team_submitted', 'system', 'teams', v_team_id,
        jsonb_build_object('registration_code', v_registration_code, 'problem_statement_id', p_problem_statement_id));

    v_result.team_id := v_team_id;
    v_result.registration_code := v_registration_code;
    RETURN v_result;
END;
$$;

-- 3. Recreate edit_team_transaction with correct audit_logs
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
    SELECT edit_token_hash INTO v_current_hash FROM teams WHERE id = p_team_id;
    IF v_current_hash IS NULL OR v_current_hash != p_edit_token_hash THEN
        RAISE EXCEPTION 'Unauthorized: Invalid edit token';
    END IF;

    UPDATE teams SET
        idea_title = p_idea_title,
        idea_description = p_idea_description,
        problem_statement_id = p_problem_statement_id,
        last_edited_at = NOW()
    WHERE id = p_team_id;

    DELETE FROM team_members WHERE team_id = p_team_id;

    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO team_members (
            team_id, role, first_name, last_name, email, phone, gender, year_of_study, department, enrollment_number
        ) VALUES (
            p_team_id,
            (v_member->>'role')::team_role,
            v_member->>'first_name',
            v_member->>'last_name',
            v_member->>'email',
            v_member->>'phone',
            (v_member->>'gender')::gender,
            v_member->>'year_of_study',
            v_member->>'department',
            v_member->>'enrollment_number'
        );
    END LOOP;

    IF p_file_path IS NOT NULL AND p_file_path != '' THEN
        UPDATE submission_files SET
            storage_path = p_file_path, file_name = p_file_name,
            file_size_bytes = p_file_size, mime_type = p_mime_type, uploaded_at = NOW()
        WHERE team_id = p_team_id AND file_type = 'presentation';
        IF NOT FOUND THEN
            INSERT INTO submission_files (team_id, file_type, storage_path, file_name, file_size_bytes, mime_type)
            VALUES (p_team_id, 'presentation', p_file_path, p_file_name, p_file_size, p_mime_type);
        END IF;
    END IF;

    INSERT INTO audit_logs (action, actor_type, entity_type, entity_id, metadata)
    VALUES ('team_edited', 'system', 'teams', p_team_id,
        jsonb_build_object('problem_statement_id', p_problem_statement_id));

    IF p_file_path IS NOT NULL AND p_file_path != '' THEN
        INSERT INTO audit_logs (action, actor_type, entity_type, entity_id, metadata)
        VALUES ('presentation_replaced', 'system', 'teams', p_team_id,
            jsonb_build_object('file_name', p_file_name, 'file_size', p_file_size));
    END IF;

    RETURN TRUE;
END;
$$;
