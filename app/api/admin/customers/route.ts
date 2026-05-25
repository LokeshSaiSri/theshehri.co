import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const search  = searchParams.get('search')?.toLowerCase();
  const segment = searchParams.get('segment');

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*, orders:orders(id, total, status, payment_status, created_at)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute tags
  const tagged = (customers ?? []).map(c => {
    const paidOrders = (c.orders as {status:string;payment_status:string;total:number;created_at:string}[])
      .filter(o => o.payment_status === 'paid');
    const totalSpent  = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const orderCount  = paidOrders.length;
    const lastOrder   = paidOrders[0]?.created_at;
    const daysSince   = lastOrder
      ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / 86400000)
      : 999;

    let tag = 'new';
    if (orderCount >= 3 || totalSpent >= 5000) tag = 'vip';
    else if (orderCount >= 2)                  tag = 'repeat';
    else if (daysSince > 90)                   tag = 'at-risk';

    return { ...c, totalSpent, orderCount, lastOrder, tag, orders: undefined };
  });

  // Filter
  let result = tagged;
  if (segment && segment !== 'all') result = result.filter(c => c.tag === segment);
  if (search) result = result.filter(c =>
    c.name?.toLowerCase().includes(search) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search)
  );

  return NextResponse.json(result);
}
