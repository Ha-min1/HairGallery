import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'scratch', 'component_inquiries_db.json');

function getLocalInquiries(): any[] {
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const data = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8');
      return JSON.parse(data) || [];
    }
  } catch (e) {
    console.error('Error reading local inquiries store:', e);
  }
  return [];
}

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

    // Attempt Supabase fetch
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabaseService
        .from('component_inquiries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Merge with local store items for this user_id if any exist locally
        const localItems = getLocalInquiries().filter(item => item.user_id === user.id);
        const map = new Map<string, any>();
        data.forEach(item => map.set(item.id, item));
        localItems.forEach(item => {
          if (!map.has(item.id)) map.set(item.id, item);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return NextResponse.json({ success: true, inquiries: merged });
      }
    }

    // Local fallback
    const userInquiries = getLocalInquiries().filter(item => item.user_id === user.id);
    userInquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, inquiries: userInquiries });
  } catch (err: any) {
    console.error('Error fetching user inquiries:', err);
    return NextResponse.json(
      { error: err.message || '본인 문의 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
