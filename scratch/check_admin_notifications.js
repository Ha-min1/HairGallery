const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// env.local is in the project root directory, which is one level up from scratch/
const envPath = path.join(__dirname, '..', '.env.local');
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

async function checkAdmins() {
  console.log("Fetching administrators from public.users...");
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, email, name, role, receive_notifications')
    .eq('role', 'ADMIN');

  if (error) {
    console.error("Error querying administrators:", error.message);
  } else {
    console.log("Registered Admins in DB:");
    console.table(admins);
  }
}

checkAdmins();
