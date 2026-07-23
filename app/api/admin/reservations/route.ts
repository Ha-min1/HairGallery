import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing environment variables' }, { status: 500 });
    }

    // 1. Verify user token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Check admin authorization
    const { data: profile } = await anonClient
      .from('users')
      .select('role, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = Boolean(
      profile?.role === 'ADMIN' ||
      profile?.is_admin === true ||
      profile?.is_admin === 'true' ||
      user.user_metadata?.role === 'ADMIN' ||
      user.user_metadata?.is_admin === true ||
      user.email === 'admin@hairgallery.com'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    // 3. Create adminClient using service key to bypass RLS and read all reservations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch all reservations, joined with services to retrieve name and price
    let data: any[] | null = null;
    const { data: firstTryData, error } = await adminClient
      .from('reservations')
      .select(`
        id,
        customer_name,
        customer_phone,
        date,
        time,
        status,
        price,
        services (
          name,
          price
        )
      `)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      // Fallback if price column doesn't exist yet in the database
      if (error.message.includes('column "price" does not exist') || error.code === 'PGRST204' || error.code === '42703') {
        const fallbackResult = await adminClient
          .from('reservations')
          .select(`
            id,
            customer_name,
            customer_phone,
            date,
            time,
            status,
            services (
              name,
              price
            )
          `)
          .order('date', { ascending: false })
          .order('time', { ascending: false });

        if (fallbackResult.error) {
          return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
        }
        data = fallbackResult.data;
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
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

    // Map database snake_case back to camelCase expected by the admin cockpit
    const mappedReservations = (data || []).map((item: any) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      serviceName: item.services?.name || 'Custom Styling',
      price: item.price !== null && item.price !== undefined ? item.price : (item.services?.price || 0),
      date: item.date ? String(item.date).split('T')[0].trim() : '',
      time: formatTimeHHMM(item.time),
      status: item.status,
    }));

    return NextResponse.json({ reservations: mappedReservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
