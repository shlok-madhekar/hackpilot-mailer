-- Create a new public storage bucket called 'uploads'
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on the objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Note: Just like the `usage_codes` table, because the Next.js API route uses the
-- SUPABASE_SERVICE_ROLE_KEY (master key) to upload these files, it automatically bypasses RLS.
-- We intentionally DO NOT create any public access policies for SELECT or INSERT here.
-- This completely locks down the bucket so strangers on the internet cannot upload malicious
-- files or view other organizers' uploaded CSVs/Prospectuses.
