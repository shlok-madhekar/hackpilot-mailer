CREATE TABLE usage_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    "limitPerDay" INTEGER NOT NULL,
    "durationDays" INTEGER,
    "activatedAt" TIMESTAMP WITH TIME ZONE,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "usageToday" FLOAT DEFAULT 0,
    "lastReset" TEXT NOT NULL
);

-- Note: To seed data from codes.json into Supabase easily, you can use the Supabase Dashboard UI to upload the CSV/JSON directly,
-- or write a quick node script using the @supabase/supabase-js client to insert the records.
