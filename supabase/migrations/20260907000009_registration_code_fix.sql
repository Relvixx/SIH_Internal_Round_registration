-- Migration 00009: Registration Code Fix
-- Description: The teams table trigger for registration_code was only on UPDATE.
-- Since register_team_transaction directly INSERTs as 'submitted', we must generate the code manually.

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

    -- Generate registration code directly since we insert as 'submitted'
    v_registration_code := 'MET-' || LPAD(nextval('registration_code_seq')::TEXT, 3, '0');

    INSERT INTO teams (
        idea_title, idea_description, problem_statement_id, status, edit_token_hash, registration_code
    ) VALUES (
        p_idea_title, p_idea_description, p_problem_statement_id, 'submitted', p_edit_token_hash, v_registration_code
    ) RETURNING id INTO v_team_id;

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
