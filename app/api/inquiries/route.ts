import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target_component = '일반 매장 문의',
      title,
      content,
      category = 'general',
      debug_info = {},
      user_id = null,
      user_email = null,
      user_name = null,
      user_role = 'USER'
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const newInquiry = {
      id: crypto.randomUUID(),
      user_id,
      user_email,
      user_name: user_name || (user_id ? '회원' : '비회원 (Guest)'),
      user_role: user_role || 'USER',
      target_component,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      status: 'pending',
      reply_content: null,
      replied_at: null,
      admin_reply: null,
      debug_info,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });

      const { data, error } = await supabase
        .from('component_inquiries')
        .insert([newInquiry])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, inquiry: data });
      }
      console.warn('Supabase insert notice:', error?.message);
    }

    return NextResponse.json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    console.error('Error submitting inquiry:', err);
    return NextResponse.json(
      { error: err.message || '문의 접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
