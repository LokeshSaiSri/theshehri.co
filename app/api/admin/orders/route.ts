import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const status  = searchParams.get('status');
  const search  = searchParams.get('search')?.toLowerCase();
  const page    = parseInt(searchParams.get('page') ?? '1');
  const limit   = 25;
  const offset  = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, subtotal, shipping, total,
      created_at, tracking_number, tracking_url, source,
      customer:customers(id, name, phone, email, city, state)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === 'manual') {
    query = query.eq('source', 'manual');
  } else if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Client-side search filter (for name/phone/order#)
  const filtered = search
    ? (data ?? []).filter(o =>
        o.order_number?.toLowerCase().includes(search) ||
        (o.customer as unknown as { name: string; phone: string })?.name?.toLowerCase().includes(search) ||
        (o.customer as unknown as { name: string; phone: string })?.phone?.includes(search)
      )
    : data ?? [];

  return NextResponse.json({ orders: filtered, total: count ?? 0, page, limit });
}
