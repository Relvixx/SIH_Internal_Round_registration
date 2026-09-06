-- Migration 00007: Phase 3 Search Fix
-- Description: Adds a search_text column to admin_teams_view to enable searching by team member details (names, emails, enrollment numbers).

DROP VIEW IF EXISTS admin_teams_view;

CREATE OR REPLACE VIEW admin_teams_view AS
SELECT 
    t.*,
    ps.ps_id AS problem_statement_code,
    ps.title AS problem_statement_title,
    ps.theme AS problem_statement_theme,
    ps.organization AS problem_statement_organization,
    (
        SELECT string_agg(
            concat_ws(' ', m.first_name, m.last_name, m.email, m.enrollment_number, m.phone),
            ' | '
        )
        FROM team_members m
        WHERE m.team_id = t.id
    ) AS search_text
FROM teams t
LEFT JOIN problem_statements ps ON t.problem_statement_id = ps.id;
