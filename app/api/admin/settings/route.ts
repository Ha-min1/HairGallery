import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Helper function to check if the requester has admin privilege
async function verifyAdminUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing or malformed Authorization header' };
  }

  const token = authHeader.split(' ')[1];
  const adminClient = getAdminClient();

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return { isAdmin: false, error: 'Unauthorized credentials' };
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = Boolean(
    profile?.role === 'ADMIN' ||
    (profile?.role && String(profile.role).toUpperCase() === 'ADMIN') ||
    profile?.is_admin === true ||
    profile?.is_admin === 'true' ||
    user.user_metadata?.role === 'ADMIN' ||
    user.user_metadata?.is_admin === true ||
    user.email === 'admin@hairgallery.com'
  );

  return { isAdmin, user };
}

// GET: Fetch all admin settings
export async function GET(req: NextRequest) {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('admin_settings')
      .select('key, value');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upsert admin setting (toggle)
export async function POST(req: NextRequest) {
  try {
    const { isAdmin, error: authError } = await verifyAdminUser(req);
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Access denied: Requires administrator privilege' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters. Key and boolean value are required.' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('admin_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('key, value')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, setting: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
