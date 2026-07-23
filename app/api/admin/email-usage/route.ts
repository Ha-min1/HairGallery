import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase admin client to query email logs bypass RLS
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export async function GET(req: NextRequest) {
  try {
    // A. Verify Authorization JWT Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const adminClient = getAdminClient();

    // B. Get user metadata from token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    // C. Verify user has ADMIN role
    const { data: profile } = await adminClient
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
      return NextResponse.json({ error: 'Access denied: Requires administrator privilege' }, { status: 403 });
    }

    // D. Calculate Billing Cycle Period based on EMAILJS_RESET_DAY
    // We default to the 16th of the month based on user's active billing cycle
    const resetDayEnv = process.env.EMAILJS_RESET_DAY;
    const resetDay = resetDayEnv ? parseInt(resetDayEnv, 10) : 16;

    const now = new Date();
    let startYear = now.getFullYear();
    let startMonth = now.getMonth(); // 0-indexed (Jan = 0)

    // If current date is before the reset day, the billing cycle started in the previous month
    if (now.getDate() < resetDay) {
      startMonth -= 1;
      if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
      }
    }

    // Billing cycle start timestamp
    const cycleStart = new Date(startYear, startMonth, resetDay, 0, 0, 0, 0);

    // Billing cycle end / next reset timestamp
    let endYear = startYear;
    let endMonth = startMonth + 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
    const nextResetDate = new Date(endYear, endMonth, resetDay, 0, 0, 0, 0);

    // E. Query total successful email sending records in current billing cycle
    const { count, error: queryError } = await adminClient
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('sent_at', cycleStart.toISOString());

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const limit = 200; // EmailJS Free plan limit
    const usage = count || 0;
    const remaining = Math.max(0, limit - usage);

    // Format display dates in local time format YYYY-MM-DD
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return NextResponse.json({
      success: true,
      limit,
      usage,
      remaining,
      startDate: formatDateStr(cycleStart),
      resetDate: formatDateStr(nextResetDate)
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Email Usage API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
