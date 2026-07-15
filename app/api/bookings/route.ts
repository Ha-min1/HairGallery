import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Helper to get admin Supabase client to bypass strict RLS for server-side proxy
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

// 1. GET: Fetch existing active reservations for slot validation (Proxy via Admin client to avoid RLS leak)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date query param is required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // Query active (non-cancelled) reservations for the selected date
    const { data, error } = await adminClient
      .from('reservations')
      .select('time, status')
      .eq('date', date)
      .neq('status', 'Cancelled');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the list of booked slots (times) to disable them on client
    const bookedSlots = data.map((item: any) => item.time);
    return NextResponse.json({ date, bookedSlots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new styling reservation with transactional/concurrency safety
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, customerName, customerPhone, serviceId, date, time } = body;

    // Validate request inputs
    if (!customerName || !customerPhone || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required reservation fields' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // A. Pre-insert check for double booking
    const { data: duplicateCheck, error: checkError } = await adminClient
      .from('reservations')
      .select('id')
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'Cancelled')
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'This time slot was already booked by another client.' },
        { status: 409 }
      );
    }

    // B. Insert reservation. Database partial unique index handles concurrency.
    const { data, error } = await adminClient
      .from('reservations')
      .insert([
        {
          user_id: userId || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          service_id: serviceId,
          date,
          time,
          status: 'Pending' // Initial state pending salon owner's review
        }
      ])
      .select()
      .single();

    if (error) {
      // Catch PostgreSQL unique constraint violation (SQLSTATE 23505)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This time slot was already booked by another client.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
