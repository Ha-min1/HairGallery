import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase admin client that bypasses RLS policies
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export async function POST(req: NextRequest) {
  try {
    // A. Verify Authorization JWT Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const adminClient = getAdminClient();

    // B. Get user metadata from token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    // C. Verify user has ADMIN role
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied: Requires administrator privilege' }, { status: 403 });
    }

    // D. Extract request body
    const body = await req.json();
    const { reservationIds } = body;

    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json({ error: 'Missing reservationIds list' }, { status: 400 });
    }

    console.log(`[Bulk Delete] Admin ${user.email} is deleting reservations:`, reservationIds);

    // E. Perform deletion in public.reservations
    const { error: deleteError } = await adminClient
      .from('reservations')
      .delete()
      .in('id', reservationIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: reservationIds.length }, { status: 200 });

  } catch (error: any) {
    console.error('[Bulk Delete API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
