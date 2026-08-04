import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramDailyBriefing } from '@/lib/telegram';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const authHeader = req.headers.get('authorization');
    const isVercelCron = req.headers.get('x-vercel-cron') === '1' || req.headers.get('user-agent')?.includes('vercel-cron');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const cronSecret = process.env.CRON_SECRET;

    // Normalize authorization header token (strip optional 'Bearer ' prefix)
    const tokenFromHeader = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

    // Check authorization:
    // 1) Automatic Vercel Cron trigger (x-vercel-cron header or user-agent)
    // 2) Manual key parameter via URL query string (?key=...)
    // 3) Authorization header matching cronSecret, serviceKey, or botToken
    const isAuthorized =
      isVercelCron ||
      (key && (key === serviceKey || key === botToken || (cronSecret && key === cronSecret))) ||
      (tokenFromHeader && (
        (cronSecret && tokenFromHeader === cronSecret) ||
        (serviceKey && tokenFromHeader === serviceKey) ||
        (botToken && tokenFromHeader === botToken)
      ));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid key or authentication header' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase environment variables' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Check if daily briefing setting is enabled
    const { data: settingData } = await adminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'telegram_daily_briefing')
      .maybeSingle();

    const isEnabled = settingData ? Boolean(settingData.value) : true;

    if (!isEnabled) {
      return NextResponse.json({ success: true, message: 'Daily briefing is disabled by settings.' });
    }

    // 2. Determine KST date (Asia/Seoul timezone YYYY-MM-DD)
    const kstDateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

    // 3. Fetch confirmed reservations for KST today using LEFT JOIN with services table
    const { data: reservations, error: resError } = await adminClient
      .from('reservations')
      .select(`
        time,
        customer_name,
        customer_phone,
        price,
        service_id,
        services!left (
          name,
          price
        )
      `)
      .or(`date.eq.${kstDateStr},date.like.${kstDateStr}%`)
      .eq('status', 'Confirmed')
      .order('time', { ascending: true });

    if (resError) throw resError;

    // 4. Transform reservations list for telegram notification
    const enrichedReservations = (reservations || []).map((res: any) => {
      const serviceName = res.services?.name || 'Custom Styling';
      const servicePrice = res.price !== null && res.price !== undefined ? res.price : (res.services?.price || 0);

      return {
        time: res.time ? String(res.time).slice(0, 5) : '10:00',
        customerName: res.customer_name || '고객',
        customerPhone: res.customer_phone || null,
        serviceName,
        price: Number(servicePrice)
      };
    });

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

