import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables for admin Supabase client');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}

// 1. GET: Fetch all administrators to display in notifications settings
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // A. Verify token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // B. Verify user is ADMIN
    const { data: profile, error: profileErr } = await anonClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const adminClient = getAdminSupabase();

    // C. Query users with role = 'ADMIN'
    // Fallback: If receive_notifications column does not exist yet (pending SQL migration),
    // we query without it and default to false to prevent runtime crashes.
    let { data: adminUsers, error: queryErr } = await adminClient
      .from('users')
      .select('id, name, email, role, receive_notifications')
      .eq('role', 'ADMIN')
      .order('name', { ascending: true });

    if (queryErr) {
      // If error is about column missing, retry selecting without it
      if (queryErr.message.includes('column "receive_notifications" does not exist') || queryErr.code === '42703') {
        const fallbackResult = await adminClient
          .from('users')
          .select('id, name, email, role')
          .eq('role', 'ADMIN')
          .order('name', { ascending: true });
        
        if (fallbackResult.error) {
          return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
        }
        
        // Map and append false as default value
        adminUsers = (fallbackResult.data || []).map((u: any) => ({
          ...u,
          receive_notifications: false
        }));
      } else {
        return NextResponse.json({ error: queryErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ adminUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. PATCH: Toggle or update receive_notifications for an admin user
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // A. Verify token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // B. Verify requester is ADMIN
    const { data: profile, error: profileErr } = await anonClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, receiveNotifications } = body;

    if (!userId || typeof receiveNotifications !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload: userId and receiveNotifications fields are required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // C. Update receive_notifications field in users table via Service Role
    const { data, error: updateErr } = await adminClient
      .from('users')
      .update({ receive_notifications: receiveNotifications })
      .eq('id', userId)
      .select('id, name, email, role, receive_notifications')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
