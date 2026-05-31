import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/shipping-settings';

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const shipping_rate = parseInt(String(body.shipping_rate), 10);
  const free_shipping_above = parseInt(String(body.free_shipping_above), 10);

  if (Number.isNaN(shipping_rate) || shipping_rate < 0) {
    return NextResponse.json({ error: 'Invalid shipping rate' }, { status: 400 });
  }
  if (Number.isNaN(free_shipping_above) || free_shipping_above < 0) {
    return NextResponse.json({ error: 'Invalid free shipping threshold' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 'default',
      shipping_rate,
      free_shipping_above,
      updated_at: new Date().toISOString(),
    })
    .select('shipping_rate, free_shipping_above')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? DEFAULT_SHIPPING_SETTINGS);
}
