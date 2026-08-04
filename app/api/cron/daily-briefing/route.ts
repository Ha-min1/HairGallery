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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase environment variables' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Check if daily briefing setting is enabled (with safe fallback)
    let isEnabled = true;
    try {
      const { data: settingData } = await adminClient
        .from('admin_settings')
        .select('value')
        .eq('key', 'telegram_daily_briefing')
        .maybeSingle();

      if (settingData && settingData.value !== undefined && settingData.value !== null) {
        isEnabled = Boolean(settingData.value);
      }
    } catch (err) {
      console.warn('[Cron Daily Briefing] Could not read admin_settings, defaulting to enabled:', err);
    }

    if (!isEnabled) {
      return NextResponse.json({ success: true, message: 'Daily briefing is disabled by admin settings.' });
    }

    // 2. Determine KST date (Asia/Seoul timezone YYYY-MM-DD)
    const kstDateStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

    // 3. Fetch confirmed reservations safely (trying joined query first, fallback to plain reservations)
    let reservations: any[] = [];
    const { data: joinData, error: joinError } = await adminClient
      .from('reservations')
      .select(`
        id,
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
      .eq('date', kstDateStr)
      .eq('status', 'Confirmed')
      .order('time', { ascending: true });

    if (joinError) {
      console.warn('[Cron Daily Briefing] Joined query failed, running plain query fallback:', joinError.message);
      const { data: plainData, error: plainError } = await adminClient
        .from('reservations')
        .select('id, time, customer_name, customer_phone, price, service_id')
        .eq('date', kstDateStr)
        .eq('status', 'Confirmed')
        .order('time', { ascending: true });

      if (plainError) {
        throw new Error(`Database query failed: ${plainError.message}`);
      }
      reservations = plainData || [];
    } else {
      reservations = joinData || [];
    }

    // 4. Transform & enrich reservations
    const enrichedReservations = await Promise.all((reservations || []).map(async (res: any) => {
      let serviceName = res.services?.name || 'Custom Styling';
      let servicePrice = res.price !== null && res.price !== undefined ? res.price : (res.services?.price || 0);

      // If service name is not available from join and service_id exists, attempt direct lookup
      if (!res.services?.name && res.service_id) {
        try {
          const { data: serviceData } = await adminClient
            .from('services')
            .select('name, price')
            .eq('id', res.service_id)
            .maybeSingle();

          if (serviceData) {
            serviceName = serviceData.name || serviceName;
            if (res.price === null || res.price === undefined) {
              servicePrice = serviceData.price || 0;
            }
          }
        } catch (_) {}
      }

      return {
        time: res.time ? String(res.time).slice(0, 5) : '10:00',
        customerName: res.customer_name || '고객',
        customerPhone: res.customer_phone || null,
        serviceName,
        price: Number(servicePrice)
      };
    }));

    // 5. Send telegram briefing
    const success = await sendTelegramDailyBriefing({
      date: kstDateStr,
      reservationsList: enrichedReservations
    });

    return NextResponse.json({
      success,
      date: kstDateStr,
      count: enrichedReservations.length,
      message: success ? 'Daily briefing sent successfully.' : 'Daily briefing attempt completed (Telegram dispatch skipped or failed).'
    });

  } catch (error: any) {
    console.error('[Cron Daily Briefing Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}


