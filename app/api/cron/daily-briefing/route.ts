import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramDailyBriefing } from '@/lib/telegram';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!key || (key !== serviceKey && key !== botToken)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid key' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Check if daily briefing setting is enabled
    const { data: settingData } = await adminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'telegram_daily_briefing')
      .maybeSingle();

    const isEnabled = settingData ? settingData.value : true;

    if (!isEnabled) {
      return NextResponse.json({ success: true, message: 'Daily briefing is disabled by settings.' });
    }

    // 2. Determine KST date (UTC+9)
    const now = new Date();
    const kstDateStr = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 3. Fetch confirmed reservations for KST today
    const { data: reservations, error: resError } = await adminClient
      .from('reservations')
      .select(`
        time,
        customer_name,
        customer_phone,
        price,
        service_id
      `)
      .eq('date', kstDateStr)
      .eq('status', 'Confirmed')
      .order('time', { ascending: true });

    if (resError) throw resError;

    // 4. Resolve service names
    const enrichedReservations = await Promise.all((reservations || []).map(async (res) => {
      let serviceName = 'Custom Styling';
      let servicePrice = res.price || 0;

      if (res.service_id) {
        const { data: serviceData } = await adminClient
          .from('services')
          .select('name, price')
          .eq('id', res.service_id)
          .maybeSingle();
        
        if (serviceData) {
          serviceName = serviceData.name;
          if (!res.price) {
            servicePrice = serviceData.price || 0;
          }
        }
      }

      return {
        time: res.time,
        customerName: res.customer_name,
        customerPhone: res.customer_phone,
        serviceName,
        price: servicePrice
      };
    }));

    // 5. Send telegram briefing
    const success = await sendTelegramDailyBriefing({
      date: kstDateStr,
      reservationsList: enrichedReservations
    });

    return NextResponse.json({ success, date: kstDateStr, count: enrichedReservations.length });

  } catch (error: any) {
    console.error('[Cron Daily Briefing Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
