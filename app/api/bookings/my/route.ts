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

// GET: Retrieve reservations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const authHeader = req.headers.get('Authorization');

    const adminClient = getAdminSupabase();

    // 1. If auth token is provided, verify it and query by user_id
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }

      // Query reservations matching user_id
      const { data, error } = await adminClient
        .from('reservations')
        .select(`
          *,
          services (
            name,
            price,
            duration_minutes
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reservations: data });
    }

    // 2. Otherwise, if name and phone are provided, query by customer details (non-member)
    if (name && phone) {
      const { data, error } = await adminClient
        .from('reservations')
        .select(`
          *,
          services (
            name,
            price,
            duration_minutes
          )
        `)
        .eq('customer_name', name.trim())
        .eq('customer_phone', phone.trim())
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reservations: data });
    }

    return NextResponse.json({ error: 'Missing name/phone parameters or authentication header' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Cancel a reservation (supports member validation via Token or non-member validation via Name & Phone)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId, name, phone } = body;

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    const adminClient = getAdminSupabase();

    // 1. Authenticated member cancellation
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
      
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }

      // First retrieve to verify ownership
      const { data: reservation, error: fetchError } = await adminClient
        .from('reservations')
        .select('user_id, status')
        .eq('id', reservationId)
        .single();

      if (fetchError || !reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }

      if (reservation.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized: You do not own this reservation' }, { status: 403 });
      }

      if (reservation.status === 'Cancelled') {
        return NextResponse.json({ error: 'Reservation is already cancelled' }, { status: 400 });
      }

      // Perform cancellation
      const { error: updateError } = await adminClient
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('id', reservationId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // 2. Non-member cancellation
    if (name && phone) {
      // First retrieve to verify matching details
      const { data: reservation, error: fetchError } = await adminClient
        .from('reservations')
        .select('customer_name, customer_phone, status')
        .eq('id', reservationId)
        .single();

      if (fetchError || !reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }

      if (
        reservation.customer_name.trim() !== name.trim() ||
        reservation.customer_phone.replace(/\D/g, '') !== phone.replace(/\D/g, '')
      ) {
        return NextResponse.json({ error: 'Unauthorized: Customer details do not match' }, { status: 403 });
      }

      if (reservation.status === 'Cancelled') {
        return NextResponse.json({ error: 'Reservation is already cancelled' }, { status: 400 });
      }

      // Perform cancellation
      const { error: updateError } = await adminClient
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('id', reservationId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unauthorized action' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
