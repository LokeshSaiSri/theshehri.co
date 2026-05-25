import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *, customer:customers(*),
      items:order_items(*, product:products(name, slug, images))
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const allowed = ['status', 'tracking_number', 'tracking_url', 'admin_notes', 'shipped_at', 'delivered_at'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  // Auto-set timestamps
  if (body.status === 'shipped'   && !update.shipped_at)   update.shipped_at   = new Date().toISOString();
  if (body.status === 'delivered' && !update.delivered_at) update.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
