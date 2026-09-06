# Security Architecture

The SIH Internal Portal implements a zero-trust model using Supabase's security features and Next.js server architecture.

## 1. Authentication

Admin authentication is handled securely via Supabase Auth (GoTrue):
- Uses standard email/password.
- Next.js Middleware (`src/lib/supabase/middleware.ts`) verifies the session token on every request to `/admin/*`.
- Unauthenticated users are hard-redirected to `/admin/login`.

## 2. Authorization (RBAC)

Authentication is not enough to access the admin panel; the user must also be an authorized admin.

- The `admin_users` table acts as the source of truth for authorization.
- The `requireAdmin()` helper (`src/lib/auth/index.ts`) queries the database using the Service Role to verify that the authenticated user's ID exists in the `admin_users` table.
- If they are authenticated but not in the `admin_users` table, they receive an unauthorized error and are redirected.

## 3. Client Architecture

We strictly separate database access into three tiers (`src/lib/supabase/`):

1. **Client (`client.ts`)**: Uses the public Anon key. Exposed to the browser. Relies entirely on RLS for security.
2. **Server (`server.ts`)**: Uses the public Anon key but operates in Server Components/Actions. Inherits the user's cookie session. Relies on RLS for security.
3. **Admin (`admin.ts`)**: Uses the secret `SUPABASE_SERVICE_ROLE_KEY`. Bypasses all RLS. Used **only** in Server Actions after strict authorization checks (e.g., updating settings, uploading templates, verifying file constraints).

## 4. File Security

Uploading and downloading files presents significant security risks, which are mitigated by:

1. **Extension & MIME Validation**: Files are checked against an explicit allowlist (e.g., `.pdf`, `.pptx`). Both the extension and the actual MIME type provided by the browser/server are validated.
2. **File Size Limits**: Hard limits are enforced at the Server Action level (default: 50MB for PPT).
3. **Name Sanitization**: Uploaded file names are strictly sanitized to prevent path traversal attacks or injection. Non-alphanumeric characters are stripped or replaced with hyphens.
4. **Storage Policies**: Private buckets (`team-submissions`) can only be read by admins.

## 5. Form Validation

Every Server Action first passes the incoming `FormData` or JSON payload through a Zod schema (`src/lib/validation/schemas.ts`). This ensures type safety and strips unknown/malicious fields before touching the database.

## 6. Audit Logging

Every critical administrative action is logged to the `audit_logs` table, storing the actor (admin ID), action type, target entity, and metadata (e.g., before/after values). This ensures accountability for system changes.
