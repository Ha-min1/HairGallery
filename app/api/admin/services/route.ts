import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

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

// Helper to verify admin role
async function checkAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  const { data: profile } = await anonClient
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = Boolean(
    profile?.role === 'ADMIN' ||
    profile?.is_admin === true ||
    user.user_metadata?.role === 'ADMIN' ||
    user.user_metadata?.is_admin === true ||
    user.email === 'admin@hairgallery.com'
  );

  if (!isAdmin) {
    return { error: 'Forbidden: Admin privilege required', status: 403 };
  }

  return { user, error: null };
}

// 1. PUT: Update a service in public.services
export async function PUT(req: NextRequest) {
  try {
    const auth = await checkAdmin(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, title, price, durationMinutes, duration_minutes, description, category, displayOrder, display_order, is_active } = body;
    const targetId = body.id || body.originalId;

    const itemName = (name || title || '').trim();
    if (!targetId || !itemName) {
      return NextResponse.json({ error: 'ID and service name are required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    const rawPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;

    const payload: any = {
      category: category || '커트',
      name: itemName,
      price: numericPrice,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : (durationMinutes !== undefined ? Number(durationMinutes) : 30),
      description: description ? description.trim() : null,
      display_order: display_order !== undefined ? Number(display_order) : (displayOrder !== undefined ? Number(displayOrder) : 0),
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    const { data, error } = await adminClient
      .from('services')
      .update(payload)
      .eq('id', targetId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new service in public.services
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdmin(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { id, name, title, price, durationMinutes, duration_minutes, description, category, displayOrder, display_order, is_active } = body;

    const itemName = (name || title || '').trim();
    if (!itemName) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    const rawPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;

    const payload: any = {
      ...(id && { id }),
      category: category || '커트',
      name: itemName,
      price: numericPrice,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : (durationMinutes !== undefined ? Number(durationMinutes) : 30),
      description: description ? description.trim() : null,
      display_order: display_order !== undefined ? Number(display_order) : (displayOrder !== undefined ? Number(displayOrder) : 0),
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    const { data, error } = await adminClient
      .from('services')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Remove a service from public.services
export async function DELETE(req: NextRequest) {
  try {
    const auth = await checkAdmin(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || null;
      } catch (e) {
        // query string only
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    const { error } = await adminClient
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
