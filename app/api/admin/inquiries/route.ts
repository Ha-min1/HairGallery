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

function saveLocalInquiries(items: any[]) {
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local inquiries store:', e);
  }
}

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { isAdmin: false, error: 'Unauthorized: Token missing' };

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, error: 'Missing environment configuration' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

  if (authErr || !user) {
    return { isAdmin: false, error: 'Unauthorized: Invalid token' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'ADMIN') {
    return { isAdmin: false, error: 'Forbidden: Admin access required' };
  }

  return { isAdmin: true, user };
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseInquiries: any[] = [];
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('component_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseInquiries = data;
      }
    }

    // Merge with local store to ensure no lost inquiries
    const localInquiries = getLocalInquiries();
    const map = new Map<string, any>();
    supabaseInquiries.forEach(item => map.set(item.id, item));
    localInquiries.forEach(item => {
      if (!map.has(item.id)) map.set(item.id, item);
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ inquiries: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching inquiries' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, reply_content, admin_reply } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const finalReply = reply_content !== undefined ? reply_content : admin_reply;
    const updatePayload: any = { updated_at: new Date().toISOString() };
    
    if (status !== undefined) updatePayload.status = status;
    if (finalReply !== undefined) {
      updatePayload.reply_content = finalReply;
      updatePayload.admin_reply = finalReply; // backward compatibility
      if (finalReply && finalReply.trim().length > 0) {
        updatePayload.replied_at = new Date().toISOString();
        if (!status) updatePayload.status = 'replied';
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      await supabase
        .from('component_inquiries')
        .update(updatePayload)
        .eq('id', id);
    }

    // Update local store
    const localItems = getLocalInquiries();
    const updatedLocal = localItems.map(item => {
      if (item.id === id) {
        return { ...item, ...updatePayload };
      }
      return item;
    });
    saveLocalInquiries(updatedLocal);

    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating inquiry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await verifyAdmin(req);
    if (!authCheck.isAdmin) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      await supabase
        .from('component_inquiries')
        .delete()
        .eq('id', id);
    }

    // Update local store
    const localItems = getLocalInquiries();
    const updatedLocal = localItems.filter(item => item.id !== id);
    saveLocalInquiries(updatedLocal);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting inquiry' }, { status: 500 });
  }
}
