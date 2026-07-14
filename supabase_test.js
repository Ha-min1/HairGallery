const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "Found" : "Missing");
console.log("Supabase Anon Key:", supabaseAnonKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Missing credentials in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log("Testing connection and querying tables...");
  
  // 1. Check services table
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name')
    .limit(3);
    
  if (servicesError) {
    console.error("❌ Error querying 'services' table:", servicesError.message, servicesError.details || "");
  } else {
    console.log("✅ Successfully connected to 'services' table. Sample data:", services);
  }

  // 2. Check reservations table
  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('id')
    .limit(1);
    
  if (reservationsError) {
    console.error("❌ Error querying 'reservations' table:", reservationsError.message, reservationsError.details || "");
  } else {
    console.log("✅ Successfully connected to 'reservations' table.");
  }
}

runTest();
