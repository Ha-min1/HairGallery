import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json({ error: '유효하지 않은 인증 세션입니다.' }, { status: 401 });
    }

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabaseService
        .from('component_inquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, inquiries: data });
      }
      console.warn('Supabase inquiries my fetch notice:', error?.message);
    }

    return NextResponse.json({ success: true, inquiries: [] });
  } catch (err: any) {
    console.error('Error fetching user inquiries:', err);
    return NextResponse.json(
      { error: err.message || '본인 문의 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
