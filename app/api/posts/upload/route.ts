import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) return false;

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const { data: profile } = await supabaseService
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role === 'ADMIN' || profile?.is_admin === true;
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: '게시글 사진 업로드는 관리자만 이용할 수 있습니다.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const staticPath = formData.get('static_path') as string | null;

    if (staticPath && staticPath.trim()) {
      return NextResponse.json({ success: true, image_url: staticPath.trim() });
    }

    if (!file) {
      return NextResponse.json({ error: '업로드할 이미지 파일 또는 정적 경로가 필요합니다.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const ext = file.name.split('.').pop() || 'png';
      const filename = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { data: storageData, error: storageErr } = await supabase
        .storage
        .from('gallery')
        .upload(filename, arrayBuffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (!storageErr && storageData) {
        const { data: publicUrlData } = supabase
          .storage
          .from('gallery')
          .getPublicUrl(filename);

        return NextResponse.json({ success: true, image_url: publicUrlData.publicUrl });
      } else if (storageErr) {
        console.warn('Supabase storage upload notice:', storageErr.message);
      }
    }

    // Fallback static sample if storage is not configured
    return NextResponse.json({ success: true, image_url: '/image/hair_gallery_logo.png' });
  } catch (err: any) {
    console.error('Error uploading post image:', err);
    return NextResponse.json({ error: err.message || '이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
