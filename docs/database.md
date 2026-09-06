# Database Schema Architecture

The portal uses Supabase (PostgreSQL) with a highly relational schema and Row Level Security (RLS).

## ER Diagram

```mermaid
erDiagram
    admin_users ||--o{ team_evaluations : "evaluates"
    admin_users ||--o{ admin_notes : "authors"
    
    event_settings {
        UUID id PK
        TEXT event_name
        INTEGER event_year
        BOOLEAN registration_open
        INTEGER minimum_team_size
    }
    
    problem_statements ||--o{ teams : "selected by"
    problem_statements {
        UUID id PK
        TEXT ps_id UK
        TEXT title
        TEXT theme
        TEXT category
    }
    
    teams ||--|{ team_members : "has"
    teams ||--o{ submission_files : "uploads"
    teams ||--o{ team_evaluations : "receives"
    teams ||--o{ admin_notes : "has"
    teams {
        UUID id PK
        TEXT registration_code UK
        team_status status
        TEXT idea_title
        UUID problem_statement_id FK
    }
    
    team_members {
        UUID id PK
        UUID team_id FK
        team_role role
        TEXT email UK "per team"
        gender gender
    }
    
    evaluation_criteria ||--o{ team_evaluations : "used in"
    evaluation_criteria {
        UUID id PK
        TEXT name
        INTEGER max_score
        FLOAT weight
    }
```

## Security & Access Control

All tables are protected by Row Level Security (RLS):
1. **Public/Anonymous Users**: Cannot write to any table. Can read active `problem_statements` and `evaluation_criteria`. Can read public `event-assets` storage bucket.
2. **Team Registration (Phase 2)**: Submissions are handled via server actions using the `SUPABASE_SERVICE_ROLE_KEY` to securely bypass RLS and insert data without exposing write permissions to the client.
3. **Super Admins**: Full read/write access to all tables via RLS.
4. **Evaluators (Phase 2)**: Can view teams, insert/update their *own* evaluations and notes.

## Audit Logging

An `audit_logs` table tracks critical events:
- Settings modifications
- PPT template uploads/replacements
- Evaluator scoring
- Admin status overrides

This provides accountability for all administrative actions.
