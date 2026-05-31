import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order')?.trim().toUpperCase();

  if (!orderNumber) {
    return NextResponse.json({ error: 'Order number required' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, tracking_number, created_at,
      items:order_items(product_name, size, color, quantity)
    `)
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, order });
}
