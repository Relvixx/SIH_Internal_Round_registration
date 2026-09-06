-- Migration 00003: Phase 2 Updates
-- Description: Update registration code format and add edit token fields

-- 1. Update the registration code generation trigger function
CREATE OR REPLACE FUNCTION generate_registration_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'draft' AND OLD.status = 'draft' AND NEW.registration_code IS NULL THEN
        -- Generate METSIH-XXXX (4 padded digits)
        NEW.registration_code := 'METSIH-' || LPAD(nextval('registration_code_seq')::TEXT, 4, '0');
        IF NEW.submitted_at IS NULL THEN
            NEW.submitted_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add Edit Token and Timestamp to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS edit_token_hash TEXT,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- 3. Set up the submissions storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions', 
    'submissions', 
    false, -- Private bucket
    52428800, -- 50MB
    '{"application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"}'
) ON CONFLICT (id) DO NOTHING;

-- 4. Set Storage RLS Policies
-- Only Service Role or authenticated admins can read
CREATE POLICY "Admins can view submissions" ON storage.objects
FOR SELECT USING (
    bucket_id = 'submissions' AND 
    (
        auth.role() = 'service_role' OR 
        EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
    )
);

-- Only Service Role can insert/update (backend route handler will do this)
CREATE POLICY "Service Role can insert submissions" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'submissions' AND auth.role() = 'service_role'
);

CREATE POLICY "Service Role can update submissions" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'submissions' AND auth.role() = 'service_role'
);

CREATE POLICY "Service Role can delete submissions" ON storage.objects
FOR DELETE USING (
    bucket_id = 'submissions' AND auth.role() = 'service_role'
);
