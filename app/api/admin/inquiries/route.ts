import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'scratch', 'component_inquiries_db.json');

function getLocalInquiries(): any[] {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_PATH)) return [];
    const data = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function updateLocalInquiry(id: string, updateData: any) {
  try {
    const items = getLocalInquiries();
    const updated = items.map(item => item.id === id ? { ...item, ...updateData, updated_at: new Date().toISOString() } : item);
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('Error updating local inquiry:', err);
  }
}

function deleteLocalInquiry(id: string) {
  try {
    const items = getLocalInquiries();
    const filtered = items.filter(item => item.id !== id);
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {
    console.error('Error deleting local inquiry:', err);
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

    let dbInquiries: any[] = [];
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('component_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbInquiries = data;
      }
    }

    // Merge with local storage fallback items to ensure completeness
    const localInquiries = getLocalInquiries();
    const dbIds = new Set(dbInquiries.map(i => i.id));
    const merged = [...dbInquiries];

    for (const localItem of localInquiries) {
      if (!dbIds.has(localItem.id)) {
        merged.push(localItem);
      }
    }

    // Sort by created_at desc
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    const { id, status, admin_reply } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updatePayload.status = status;
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      await supabase
        .from('component_inquiries')
        .update(updatePayload)
        .eq('id', id);
    }

    // Update local storage
    updateLocalInquiry(id, updatePayload);

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      await supabase
        .from('component_inquiries')
        .delete()
        .eq('id', id);
    }

    deleteLocalInquiry(id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error deleting inquiry' }, { status: 500 });
  }
}
