-- Enable Row Level Security to lock down public access
ALTER TABLE usage_codes ENABLE ROW LEVEL SECURITY;

-- Important: Since we are querying and updating the database EXCLUSIVELY through
-- the secure Next.js Server API routes using the SUPABASE_SERVICE_ROLE_KEY,
-- we do NOT need to create any public policies!
--
-- The service_role key bypasses RLS automatically.
-- By simply enabling RLS and leaving it with 0 policies, you effectively
-- lock out the public 'anon' key from reading, writing, or editing quotas.
