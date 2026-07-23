import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminBookingAlertEmail } from '@/lib/email';
import { sendTelegramAdminAlert } from '@/lib/telegram';
import { hashNonMemberPassword } from '@/lib/crypto';

export const runtime = 'edge';

// Helper to get admin Supabase client to bypass strict RLS for server-side proxy
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

// 1. GET: Fetch existing active reservations for slot validation (Proxy via Admin client to avoid RLS leak)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date query param is required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // Query active (non-cancelled) reservations for the selected date
    const { data, error } = await adminClient
      .from('reservations')
      .select('time, status, customer_name')
      .eq('date', date)
      .neq('status', 'Cancelled');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the list of confirmed slots (bookedSlots) and pending slots separately
    const confirmedSlots = data
      .filter((item: any) => item.status === 'Confirmed' || item.status === 'Completed' || item.customer_name === '예약 마감')
      .map((item: any) => item.time);

    const pendingSlots = data
      .filter((item: any) => item.status === 'Pending' && item.customer_name !== '예약 마감')
      .map((item: any) => item.time);

    const closedSlots = data.filter((item: any) => item.customer_name === '예약 마감').map((item: any) => item.time);
    return NextResponse.json({ date, bookedSlots: confirmedSlots, pendingSlots, closedSlots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new styling reservation with transactional/concurrency safety
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, customerName, customerPhone, serviceId, date, time, password } = body;

    // Validate request inputs
    if (!customerName || !customerPhone || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required reservation fields' }, { status: 400 });
    }

    // Non-member password validation
    if (!userId && !password) {
      return NextResponse.json({ error: 'Non-member reservations require a query password.' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // A. Pre-insert check for double booking (Only Confirmed/Completed bookings block new reservations)
    const { data: duplicateCheck, error: checkError } = await adminClient
      .from('reservations')
      .select('id')
      .eq('date', date)
      .eq('time', time)
      .in('status', ['Confirmed', 'Completed'])
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

    // Fetch service price and name pre-insert to store in reservations and use for notifications
    let servicePrice = 0;
    let serviceName = 'Custom Styling';
    let dbServiceId: string | null = null;

    const CATEGORY_NAME_MAP: Record<string, string> = {
      'cat-cut': '커트 (Cut)',
      'cat-color': '염색 (Color)',
      'cat-perm': '펌 (Perm)',
      'cat-treatment': '클리닉 (Treatment)',
      'cat-styling': '스타일링 (Styling)',
      'cat-shampoo': '샴푸 (Shampoo)',
      'cat-upstyle': '업스타일 (Upstyle)',
      '커트': '커트 (Cut)',
      '염색': '염색 (Color)',
      '펌': '펌 (Perm)',
      '클리닉': '클리닉 (Treatment)',
      '스타일링': '스타일링 (Styling)',
      '샴푸': '샴푸 (Shampoo)',
      '업스타일': '업스타일 (Upstyle)',
    };

    if (serviceId) {
      if (CATEGORY_NAME_MAP[serviceId]) {
        serviceName = CATEGORY_NAME_MAP[serviceId];
      } else {
        serviceName = serviceId;
      }

      // Check if serviceId is a valid UUID in public.services
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(serviceId)) {
        const { data: serviceData } = await adminClient
          .from('services')
          .select('id, name, price')
          .eq('id', serviceId)
          .maybeSingle();

        if (serviceData) {
          dbServiceId = serviceData.id;
          serviceName = serviceData.name;
          servicePrice = serviceData.price || 0;
        }
      }
    }

    // Fallback: If dbServiceId is not a valid UUID in services, pick the first existing service ID in public.services so FK constraint passes
    if (!dbServiceId) {
      const { data: anyService } = await adminClient
        .from('services')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (anyService?.id) {
        dbServiceId = anyService.id;
      }
    }

    const reservationId = crypto.randomUUID();
    let hashedPass = null;
    if (!userId && password) {
      hashedPass = await hashNonMemberPassword(password, reservationId);
    }

    // B. Insert reservation. Database partial unique index handles concurrency.
    const { data, error } = await adminClient
      .from('reservations')
      .insert([
        {
          id: reservationId,
          user_id: userId || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          service_id: dbServiceId,
          date,
          time,
          status: 'Pending', // Initial state pending salon owner's review
          non_member_password: hashedPass,
          price: servicePrice
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

    // Trigger admin alert notifications for new booking (awaited to prevent Cloudflare Pages context termination)
    if (data) {
      try {
        // serviceName and servicePrice are already fetched before insert


        // B. Query administrators who enabled receive_notifications
        let queryResult;
        try {
          queryResult = await adminClient
            .from('users')
            .select('email, receive_notifications')
            .eq('role', 'ADMIN')
            .eq('receive_notifications', true);
        } catch (dbErr) {
          // Fallback: If receive_notifications column is missing, select all administrators
          queryResult = await adminClient
            .from('users')
            .select('email')
            .eq('role', 'ADMIN');
        }

        const adminEmails = (queryResult?.data || []).map((admin: any) => admin.email).filter(Boolean);

        if (adminEmails.length === 0) {
          console.log('[Notification Skip] No admin users have enabled receive_notifications.');
        } else {
          // C. Send alert email to each configured administrator
          for (const email of adminEmails) {
            await sendAdminBookingAlertEmail({
              toEmail: email,
              customerName: data.customer_name,
              customerPhone: data.customer_phone,
              date: data.date,
              time: data.time,
              serviceName,
              price: servicePrice
            });
          }
        }

        // D. Send Telegram notification to administrator if configured
        try {
          await sendTelegramAdminAlert({
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            date: data.date,
            time: data.time,
            serviceName,
            price: servicePrice
          });
        } catch (tgErr) {
          console.error('Failed to send Telegram admin alert:', tgErr);
        }
      } catch (alertErr) {
        console.error('Failed to send admin booking alert:', alertErr);
      }
    }

    return NextResponse.json({ success: true, reservation: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
