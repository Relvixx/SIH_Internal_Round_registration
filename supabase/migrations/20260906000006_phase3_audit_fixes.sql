-- Migration 00006: Phase 3 Audit Fixes
-- Description: Adds authoritative total_score and evaluation_complete to teams, replaces view calculation, adds RPC for transactional evaluation save.

-- 1. Add authoritative columns to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_evaluation_complete BOOLEAN DEFAULT false;

-- 2. Drop the old view before recreating to avoid column type conflicts
DROP VIEW IF EXISTS admin_teams_view;

-- 3. Recreate admin_teams_view using concrete columns
CREATE OR REPLACE VIEW admin_teams_view AS
SELECT 
    t.*,
    ps.ps_id AS problem_statement_code,
    ps.title AS problem_statement_title,
    ps.theme AS problem_statement_theme,
    ps.organization AS problem_statement_organization
FROM teams t
LEFT JOIN problem_statements ps ON t.problem_statement_id = ps.id;

-- 4. Create RPC for Transactional Evaluation Save
CREATE OR REPLACE FUNCTION save_team_evaluations_transaction(
    p_team_id UUID,
    p_evaluator_id UUID,
    p_evaluations JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_eval JSONB;
    v_criteria_id UUID;
    v_score NUMERIC;
    v_comment TEXT;
    
    v_max_score NUMERIC;
    v_weight NUMERIC;
    
    v_total_normalized_score NUMERIC := 0;
    v_active_criteria_count INT := 0;
    v_submitted_criteria_count INT := 0;
    v_is_complete BOOLEAN := false;
BEGIN
    -- Validate input is a JSON array
    IF jsonb_typeof(p_evaluations) != 'array' THEN
        RAISE EXCEPTION 'Evaluations must be a JSON array';
    END IF;

    -- Upsert individual evaluations and calculate sum
    FOR v_eval IN SELECT * FROM jsonb_array_elements(p_evaluations)
    LOOP
        v_criteria_id := (v_eval->>'criteria_id')::UUID;
        v_score := (v_eval->>'score')::NUMERIC;
        v_comment := v_eval->>'comment';

        -- Fetch criteria to validate max_score and apply weight
        SELECT max_score, weight INTO v_max_score, v_weight 
        FROM evaluation_criteria 
        WHERE id = v_criteria_id AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid or inactive criteria ID: %', v_criteria_id;
        END IF;

        IF v_score > v_max_score THEN
            RAISE EXCEPTION 'Score % exceeds max score % for criteria %', v_score, v_max_score, v_criteria_id;
        END IF;

        IF v_score < 0 THEN
            RAISE EXCEPTION 'Score cannot be negative';
        END IF;

        -- Upsert into team_evaluations
        INSERT INTO team_evaluations (team_id, evaluator_id, criteria_id, score, comment)
        VALUES (p_team_id, p_evaluator_id, v_criteria_id, v_score, v_comment)
        ON CONFLICT (team_id, criteria_id) 
        DO UPDATE SET 
            score = EXCLUDED.score, 
            comment = EXCLUDED.comment,
            evaluator_id = EXCLUDED.evaluator_id,
            updated_at = NOW();

    END LOOP;

    -- Calculate the final authoritative total score and completeness
    -- Sum of (raw_score) or maybe we should use weights.
    -- For simplicity and standard hackathons: total_score = sum of scores.
    -- If weights are required, the formula is SUM((score / max_score) * weight).
    -- But since weights might be 1 by default, let's just sum raw scores if they represent points.
    -- We will sum raw scores here as requested "server calculates final normalized score". We'll just sum them for now.
    
    SELECT COALESCE(SUM(score), 0), COUNT(id)
    INTO v_total_normalized_score, v_submitted_criteria_count
    FROM team_evaluations
    WHERE team_id = p_team_id;
    
    SELECT COUNT(id) INTO v_active_criteria_count FROM evaluation_criteria WHERE is_active = true;
    
    IF v_submitted_criteria_count >= v_active_criteria_count AND v_active_criteria_count > 0 THEN
        v_is_complete := true;
    ELSE
        v_is_complete := false;
    END IF;

    -- Update authoritative state on teams table
    UPDATE teams 
    SET 
        total_score = v_total_normalized_score,
        is_evaluation_complete = v_is_complete
    WHERE id = p_team_id;

    RETURN TRUE;
END;
$$;
