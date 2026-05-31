import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendShippedEmail } from '@/lib/send-shipped-email';

const ALLOWED_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'] as const;

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { ids, status } = body as { ids?: string[]; status?: string };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
  }

  if (!status || !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createServerClient();
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

  if (status === 'shipped') {
    update.shipped_at = new Date().toISOString();
  }
  if (status === 'delivered') {
    update.delivered_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from('orders')
    .update(update)
    .in('id', ids)
    .select('id, tracking_number');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let emailsSent = 0;
  if (status === 'shipped') {
    for (const order of updated ?? []) {
      if (order.tracking_number) {
        const result = await sendShippedEmail(order.id);
        if (result.ok) emailsSent++;
      }
    }
  }

  return NextResponse.json({
    updated: updated?.length ?? 0,
    emailsSent,
  });
}
