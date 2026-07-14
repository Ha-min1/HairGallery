import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'edge';

// 1. GET: Fetch existing active reservations for slot validation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date query param is required' }, { status: 400 });
    }

    const supabase: any = getSupabaseClient();

    // Query active (non-cancelled) reservations for the selected date
    const { data, error } = await supabase
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

    const supabase: any = getSupabaseClient();

    // A. Client-side/Pre-insert check for double booking (User-friendly message before DB error)
    const { data: duplicateCheck, error: checkError } = await supabase
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

    // B. Insert reservation. The database-level partial unique index (idx_reservations_prevent_double_booking)
    // guarantees that even in case of a race condition, two concurrent insertions for the same slot cannot succeed.
    const { data, error } = await supabase
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
