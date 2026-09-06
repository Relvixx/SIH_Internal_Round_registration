# Phase 3 — Super Admin Operations Walkthrough

This document highlights the completion of **Phase 3** of the MET BKC SIH Internal Hackathon Portal, transforming it from a registration system into a fully featured internal evaluation console.

## 1. Team Management & Review Workspace

We built the Super Admin tools required to process submitted teams:

*   **Teams Data Table (`/admin/teams`)**: A robust table view listing all teams with server-side pagination, search, and filtering, connected to the optimized `admin_teams_view`.
*   **Team Detail Workspace (`/admin/teams/[id]`)**: A comprehensive review page featuring:
    *   **Idea & Problem Statement Overview**: Detailed view of what the team submitted.
    *   **Member List**: Clear breakdown of all members, identifying the Team Leader.
    *   **Compliance & Duplicates Panel**: Automatically surfaces potential cross-team registration duplicates (identified securely via the database view `participant_duplicates_view`) and flags team size / gender compliance rules.
    *   **Status Management Modal**: Allows Admins to transition teams between lifecycle statuses (e.g. `submitted` -> `under_review` -> `needs_correction` -> `eligible`). It requires a Correction Note if a team is marked as needing corrections.
    *   **Admin Notes**: A private audit log/notepad for Super Admins to leave timestamped notes on the team.
    *   **Presentation Review**: Automatically fetches a secure, short-lived Signed URL for the team's PPT/PDF submission.

## 2. Problem Statement Management & Bulk Import

*   **Problem Statements Console (`/admin/problem-statements`)**: UI to manage available Problem Statements for the hackathon.
*   **CSV Import Feature**: Built a secure CSV importer allowing Super Admins to upload bulk lists of SIH Problem Statements (with `Papaparse` running client-side, uploading parsed data via a secure Server Action with database transactions).

## 3. Evaluation & Scoring System

*   **Configurable Criteria (`/admin/settings`)**: Super Admins can add, edit, or deactivate evaluation criteria (e.g. Innovation, Technical Feasibility) and assign max scores and weights.
*   **Evaluation Input (`/admin/teams/[id]`)**: The team detail view integrates a scoring form mapped dynamically to the configured active criteria, updating the team's `total_score` in real time.

## 4. Selection & Ranking Workflow

*   **Ranked Table (`/admin/selection`)**: Displays only evaluated teams, sorted by their `total_score` in descending order.
*   **Bulk Status Application**: Allows admins to select multiple teams via checkboxes and apply bulk status changes (e.g. `Mark Shortlisted`, `Mark Waitlisted`, `Mark Rejected`).

## 5. Secure CSV Export System

*   **Export Center (`/admin/exports`)**: Provides preset one-click download buttons (All Teams, Shortlisted, Waitlisted, Eligible).
*   **Secure API Route (`/api/admin/export`)**: Implemented a streaming Server Endpoint that generates a consolidated CSV (including flattened Leader info).
*   > [!IMPORTANT]
    > **Anti-Injection Protections**: The CSV exporter automatically prefixes cells starting with `=`, `+`, `-`, or `@` with a single quote to prevent spreadsheet software from executing malicious formula injections.

## 6. Verification

*   All Next.js App Router code is strictly typed using TypeScript.
*   Fixed lint warnings in components and verified build completion (`npm run build` exits with code 0).
*   Confirmed no Phase 1/Phase 2 workflows or participant endpoints were broken or modified outside of strict requirements.

The application is now ready for production Super Admin operations.
