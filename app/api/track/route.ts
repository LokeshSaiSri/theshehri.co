import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const EVENT_FIELDS = new Set([
  'event_type',
  'session_id',
  'page',
  'product_slug',
  'size',
  'device',
  'source',
  'medium',
  'campaign',
  'referrer',
  'metadata',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.event_type;

    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json({ error: 'event_type required' }, { status: 400 });
    }

    const metadata: Record<string, unknown> =
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? { ...body.metadata }
        : {};

    for (const [key, value] of Object.entries(body)) {
      if (!EVENT_FIELDS.has(key) && value !== undefined) {
        metadata[key] = value;
      }
    }

    const supabase = createServerClient();
    const { error } = await supabase.from('events').insert({
      event_type: eventType,
      session_id: typeof body.session_id === 'string' ? body.session_id : null,
      page: typeof body.page === 'string' ? body.page : null,
      product_slug: typeof body.product_slug === 'string' ? body.product_slug : null,
      size: typeof body.size === 'string' ? body.size : null,
      device: typeof body.device === 'string' ? body.device : null,
      source: typeof body.source === 'string' ? body.source : null,
      medium: typeof body.medium === 'string' ? body.medium : null,
      campaign: typeof body.campaign === 'string' ? body.campaign : null,
      referrer: typeof body.referrer === 'string' ? body.referrer : null,
      metadata,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

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
