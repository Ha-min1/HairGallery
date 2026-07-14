import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const supabase: any = getSupabaseClient();

    // Fetch all reservations, joined with services to retrieve name and price
    const { data, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map database snake_case back to camelCase expected by the admin cockpit
    const mappedReservations = (data || []).map((item: any) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      serviceName: item.services?.name || 'Custom Styling',
      price: item.services?.price || 0,
      date: item.date,
      time: item.time,
      status: item.status,
    }));

    return NextResponse.json({ reservations: mappedReservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
