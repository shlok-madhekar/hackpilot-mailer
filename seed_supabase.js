require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase keys in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const codes = JSON.parse(fs.readFileSync('./src/lib/codes.json', 'utf8'));

async function seed() {
  const { data, error } = await supabase.from('usage_codes').insert(codes);
  if (error) {
    console.error("Error inserting codes:", error);
  } else {
    console.log("Successfully seeded codes.json to Supabase Database!");
  }
}

seed();
