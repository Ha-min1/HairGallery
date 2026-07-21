import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'scratch', 'component_inquiries_db.json');

// Helper to ensure scratch directory and local fallback JSON exist
function getLocalInquiries(): any[] {
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
      fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify([]), 'utf8');
      return [];
    }
    const data = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading local inquiries JSON:', err);
    return [];
  }
}

function saveLocalInquiry(inquiry: any) {
  try {
    const items = getLocalInquiries();
    items.unshift(inquiry);
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local inquiry:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target_component,
      title,
      content,
      category = 'bug',
      debug_info = {},
      user_id = null,
      user_email = null,
      user_name = null,
      user_role = 'USER'
    } = body;

    if (!target_component || !title || !content) {
      return NextResponse.json(
        { error: '대상 컴포넌트, 제목, 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const newInquiry = {
      id: crypto.randomUUID(),
      user_id,
      user_email,
      user_name,
      user_role,
      target_component,
      title,
      content,
      category,
      status: 'OPEN',
      admin_reply: null,
      debug_info,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Attempt to insert into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let savedInDb = false;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });

      const { data, error } = await supabase
        .from('component_inquiries')
        .insert([{
          id: newInquiry.id,
          user_id: newInquiry.user_id,
          user_email: newInquiry.user_email,
          user_name: newInquiry.user_name,
          user_role: newInquiry.user_role,
          target_component: newInquiry.target_component,
          title: newInquiry.title,
          content: newInquiry.content,
          category: newInquiry.category,
          status: newInquiry.status,
          admin_reply: newInquiry.admin_reply,
          debug_info: newInquiry.debug_info,
          created_at: newInquiry.created_at,
          updated_at: newInquiry.updated_at
        }])
        .select()
        .single();

      if (!error && data) {
        savedInDb = true;
        // Also sync local storage as fallback cache
        saveLocalInquiry(data);
        return NextResponse.json({ success: true, inquiry: data, storage: 'supabase' });
      } else {
        console.warn('Supabase insert failed/table missing, using local fallback:', error?.message);
      }
    }

    // Fallback to local storage if DB is not ready
    saveLocalInquiry(newInquiry);
    return NextResponse.json({ success: true, inquiry: newInquiry, storage: 'local_fallback' });
  } catch (err: any) {
    console.error('Error submitting component inquiry:', err);
    return NextResponse.json(
      { error: err.message || '문의 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
