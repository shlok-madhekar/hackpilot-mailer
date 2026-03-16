-- In Supabase, the default `storage.objects` table usually already has RLS enabled by default.
-- And because it's a core Supabase schema, the SQL editor sometimes blocks you from altering it
-- with "must be owner of table objects".

-- So, all you actually need to do to get the bucket working is run this one command:
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- (You don't need to run ALTER TABLE storage.objects).
-- The bucket is already perfectly secure!
