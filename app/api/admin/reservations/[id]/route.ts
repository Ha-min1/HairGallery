import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { sendKakaoBookingNotification } from '@/lib/kakao';

export const runtime = 'edge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    const body = await req.json();
    const { status, sendNotification = true } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status field is required' }, { status: 400 });
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
    const { data: profile, error: profileErr } = await anonClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    // 3. Create adminClient using service key to bypass RLS and update reservation
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Update reservation status in database
    const { data, error } = await adminClient
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger booking confirmation notification via EmailJS (and KakaoTalk via Solapi) only if sendNotification is true
    if (status === 'Confirmed' && data && sendNotification) {
      try {
        // 1. Fetch user's email if they are a registered user
        let userEmail = '';
        if (data.user_id) {
          const { data: userData } = await adminClient
            .from('users')
            .select('email')
            .eq('id', data.user_id)
            .maybeSingle();
          if (userData) {
            userEmail = userData.email;
          }
        }

        // 2. Fetch service details for styling description and fallback price
        let serviceName = 'Custom Styling';
        let servicePrice = data.price || 0;
        
        if (data.service_id) {
          const { data: serviceData } = await adminClient
            .from('services')
            .select('name, price')
            .eq('id', data.service_id)
            .maybeSingle();
          if (serviceData) {
            serviceName = serviceData.name;
            if (!data.price) {
              servicePrice = serviceData.price || 0;
            }
          }
        }

        // 3. Dispatch the confirmation email
        if (userEmail) {
          await sendBookingConfirmationEmail({
            toEmail: userEmail,
            customerName: data.customer_name,
            date: data.date,
            time: data.time,
            serviceName,
            price: servicePrice
          });
        } else {
          console.log(`[Notification Skip] No email found for user_id: ${data.user_id || 'guest'}`);
        }

        // 4. Dispatch KakaoTalk Notification via Solapi
        if (data.customer_phone) {
          await sendKakaoBookingNotification({
            toPhone: data.customer_phone,
            customerName: data.customer_name,
            date: data.date,
            time: data.time,
            serviceName,
            price: servicePrice
          });
        } else {
          console.log('[Notification Skip] No phone number found on reservation record.');
        }

      } catch (triggerErr) {
        console.error('Failed to dispatch booking confirmation notification:', triggerErr);
      }
    }

    return NextResponse.json({ success: true, reservation: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
