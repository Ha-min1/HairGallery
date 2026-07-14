const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkIds() {
  console.log("Fetching auth.users...");
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error listing auth.users:", authErr.message);
  } else {
    console.log("Auth Users:", authUsers.map(u => ({ id: u.id, email: u.email })));
  }

  console.log("\nFetching public.users...");
  const { data: publicUsers, error: publicErr } = await supabase.from('users').select('id, email, name, role');
  if (publicErr) {
    console.error("Error listing public.users:", publicErr.message);
  } else {
    console.log("Public Users:", publicUsers);
  }
}

checkIds();
