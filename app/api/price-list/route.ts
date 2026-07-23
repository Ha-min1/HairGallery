import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

async function verifyAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { user: null, error: '인증 헤더가 없습니다.' };

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Supabase 설정이 올바르지 않습니다.' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return { user: null, error: '유효하지 않은 인증 세션입니다.' };
  }

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const { data: profile } = await supabaseService
    .from('users')
    .select('id, name, email, role, is_admin')
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
    return { user: null, error: '관리자 권한이 필요합니다.' };
  }

  return { user: { id: user.id, isAdmin: true }, error: null };
}

// 1. GET: Public fetch of services list from unified public.services table
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data) {
        const formatted = data.map((item: any) => ({
          ...item,
          title: item.name || item.title,
          name: item.name || item.title
        }));
        return NextResponse.json({ success: true, items: formatted });
      }
    }

    return NextResponse.json({ success: true, items: [] });
  } catch (err: any) {
    console.error('Error fetching services list:', err);
    return NextResponse.json({ success: true, items: [] });
  }
}

// 2. POST: Admin insert new service item into public.services
export async function POST(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const body = await req.json();
    const { category, title, name, price, description, duration_minutes, display_order, is_active } = body;

    const itemName = (title || name || '').trim();
    if (!category || !itemName || price === undefined || price === null || price === '') {
      return NextResponse.json({ error: '카테고리, 시술명, 가격은 필수 입력 항목입니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const rawPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;

    const payload: any = {
      category: category.trim(),
      name: itemName,
      price: numericPrice,
      description: description ? description.trim() : null,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : 30,
      display_order: display_order !== undefined ? Number(display_order) : 0,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    const { data, error } = await supabase
      .from('services')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const formatted = {
      ...data,
      title: data.name,
      name: data.name
    };

    return NextResponse.json({ success: true, item: formatted });
  } catch (err: any) {
    console.error('Error inserting service item:', err);
    return NextResponse.json({ error: err.message || '시술 항목 추가 실패' }, { status: 500 });
  }
}

// 3. PUT: Admin update existing service item in public.services
export async function PUT(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
    }

    const body = await req.json();
    const { id, category, title, name, price, description, duration_minutes, display_order, is_active } = body;

    const itemName = (title || name || '').trim();
    if (!id || !category || !itemName || price === undefined || price === null || price === '') {
      return NextResponse.json({ error: 'ID, 카테고리, 시술명, 가격은 필수 항목입니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const rawPrice = String(price).replace(/[^0-9]/g, '');
    const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;

    const payload: any = {
      category: category.trim(),
      name: itemName,
      price: numericPrice,
      description: description ? description.trim() : null,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : 30,
      display_order: display_order !== undefined ? Number(display_order) : 0,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const formatted = {
      ...data,
      title: data.name,
      name: data.name
    };

    return NextResponse.json({ success: true, item: formatted });
  } catch (err: any) {
    console.error('Error updating service item:', err);
    return NextResponse.json({ error: err.message || '시술 항목 수정 실패' }, { status: 500 });
  }
}

// 4. DELETE: Admin delete service item from public.services
export async function DELETE(req: NextRequest) {
  try {
    const { error: authErr } = await verifyAdminAuth(req);
    if (authErr) {
      return NextResponse.json({ error: authErr }, { status: 403 });
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
      return NextResponse.json({ error: '삭제할 항목의 id가 필요합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err: any) {
    console.error('Error deleting service item:', err);
    return NextResponse.json({ error: err.message || '시술 항목 삭제 실패' }, { status: 500 });
  }
}
