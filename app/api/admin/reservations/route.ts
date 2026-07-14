import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const supabase: any = getSupabaseClient();

    // Fetch all reservations, joined with services to retrieve name and price
    let data: any[] | null = null;
    const { data: firstTryData, error } = await supabase
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
        const fallbackResult = await supabase
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

    // Map database snake_case back to camelCase expected by the admin cockpit
    const mappedReservations = (data || []).map((item: any) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      serviceName: item.services?.name || 'Custom Styling',
      price: item.price !== null && item.price !== undefined ? item.price : (item.services?.price || 0),
      date: item.date,
      time: item.time,
      status: item.status,
    }));

    return NextResponse.json({ reservations: mappedReservations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
