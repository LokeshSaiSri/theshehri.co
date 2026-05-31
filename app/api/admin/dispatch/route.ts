import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();

  const { data, error, count } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, tracking_number, created_at,
      customer:customers(id, name, phone, email, address_line1, address_line2, city, state, pincode),
      items:order_items(product_name, size, color, quantity)
    `, { count: 'exact' })
    .eq('status', 'processing')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [], count: count ?? 0 });
}
