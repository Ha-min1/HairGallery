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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Verify user token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Check admin authorization
    const { data: profile, error: profileErr } = await anonClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const body = await req.json();
    const { date, times } = body; // times: array of selected times to be closed, e.g. ['10:00', '11:00']

    if (!date || !Array.isArray(times)) {
      return NextResponse.json({ error: 'Invalid payload: date and times array are required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // 3. Fetch existing active reservations for the selected date
    const { data: existingReservations, error: fetchErr } = await adminClient
      .from('reservations')
      .select('id, time, customer_name, status')
      .eq('date', date)
      .neq('status', 'Cancelled');

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const activeReservations = existingReservations || [];

    // Filter which ones are admin-created blocks (customer_name = '예약 마감')
    const adminClosedReservations = activeReservations.filter(
      (r: any) => r.customer_name === '예약 마감'
    );
    const customerReservations = activeReservations.filter(
      (r: any) => r.customer_name !== '예약 마감'
    );

    const customerReservedTimes = customerReservations.map((r: any) => r.time);
    const adminClosedTimes = adminClosedReservations.map((r: any) => r.time);

    // Identify which slots to add (those in times list but not already closed/reserved)
    const toAdd = times.filter(
      (t: string) => !adminClosedTimes.includes(t) && !customerReservedTimes.includes(t)
    );

    // Identify which admin closed slots to remove (those currently closed but NOT in the incoming times list)
    const toRemove = adminClosedReservations.filter(
      (r: any) => !times.includes(r.time)
    );

    // Perform inserts
    if (toAdd.length > 0) {
      const inserts = toAdd.map((t: string) => ({
        customer_name: '예약 마감',
        customer_phone: '000-0000-0000',
        date,
        time: t,
        status: 'Confirmed',
      }));

      const { error: insertErr } = await adminClient
        .from('reservations')
        .insert(inserts);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // Perform deletes
    if (toRemove.length > 0) {
      const idsToRemove = toRemove.map((r: any) => r.id);
      const { error: deleteErr } = await adminClient
        .from('reservations')
        .delete()
        .in('id', idsToRemove);

      if (deleteErr) {
        return NextResponse.json({ error: deleteErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, added: toAdd, removed: toRemove.map((r: any) => r.time) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
