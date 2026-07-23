import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: 'Server configuration error: Missing environment variables', status: 500 };
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  const { data: profile } = await anonClient
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

  if (!isAdmin) {
    return { error: 'Forbidden: Admin privilege required', status: 403 };
  }

  return { user, error: null };
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing environment variables' }, { status: 500 });
    }

    // Always create adminClient using service role key to bypass RLS and fetch all reservations for admin dashboard
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch all reservations using LEFT JOIN with services to prevent dropping rows
    let data: any[] | null = null;
    const { data: firstTryData, error } = await adminClient
      .from('reservations')
      .select(`
        id,
        user_id,
        customer_name,
        customer_phone,
        date,
        time,
        status,
        price,
        service_id,
        services!left (
          name,
          price
        )
      `)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.warn('First try query with services join failed, attempting plain reservations query:', error.message);
      // Fallback query: Read reservations table directly without joining services
      const fallbackResult = await adminClient
        .from('reservations')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (fallbackResult.error) {
        return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
      }
      data = fallbackResult.data;
    } else {
      data = firstTryData;
    }

    // Helper to format time as HH:mm
    const formatTimeHHMM = (rawTime: any): string => {
      if (!rawTime) return '10:00';
      const str = String(rawTime).trim();
      const parts = str.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return str;
    };

    // Map database fields to unified camelCase + snake_case structure for full frontend compatibility
    const mappedReservations = (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id || null,
      user_id: item.user_id || null,
      customerName: item.customer_name || '',
      customer_name: item.customer_name || '',
      customerPhone: item.customer_phone || '',
      customer_phone: item.customer_phone || '',
      serviceId: item.service_id || null,
      service_id: item.service_id || null,
      serviceName: item.services?.name || 'Custom Styling',
      service_name: item.services?.name || 'Custom Styling',
      price: item.price !== null && item.price !== undefined ? item.price : (item.services?.price || 0),
      date: item.date ? String(item.date).split('T')[0].trim() : '',
      time: formatTimeHHMM(item.time),
      status: item.status || 'Pending',
      services: item.services || {
        name: item.services?.name || 'Custom Styling',
        price: item.price || 0
      }
    }));

    return NextResponse.json({ reservations: mappedReservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkAdmin(req);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing environment variables' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const { userId, customerName, customerPhone, serviceId, date, time, status, price } = body;

    if (!customerName || !date || !time) {
      return NextResponse.json({ error: 'Missing required reservation fields (customerName, date, time)' }, { status: 400 });
    }

    // Pre-insert check for double booking on the same date and time
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
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
    }

    const reservationId = crypto.randomUUID();
    const { data, error } = await adminClient
      .from('reservations')
      .insert([
        {
          id: reservationId,
          user_id: userId || null,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          service_id: serviceId || null,
          date,
          time,
          status: status || 'Confirmed',
          price: price !== undefined && price !== null ? Number(price) : null
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reservation: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
