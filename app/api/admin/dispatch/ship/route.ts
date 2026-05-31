import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendShippedEmail } from '@/lib/send-shipped-email';

export async function POST() {
  const supabase = createServerClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, tracking_number')
    .eq('status', 'processing')
    .not('tracking_number', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders?.length) {
    return NextResponse.json({ shipped: 0, emailsSent: 0 });
  }

  const now = new Date().toISOString();
  let emailsSent = 0;

  for (const order of orders) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        shipped_at: now,
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('status', 'processing');

    if (updateError) continue;

    const emailResult = await sendShippedEmail(order.id);
    if (emailResult.ok) emailsSent++;
  }

  return NextResponse.json({
    shipped: orders.length,
    emailsSent,
  });
}
