import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
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
