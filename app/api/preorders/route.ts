import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getVariantAvailability, reserveVariant, resolveVariant } from '@/lib/inventory';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const data = await req.json();
    const { name, email, phone, product, productId, size } = data;

    if (!name || !email || !product || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let resolvedProductId = productId as string | undefined;
    if (!resolvedProductId) {
      const { data: prod } = await supabase
        .from('products')
        .select('id')
        .eq('name', product)
        .maybeSingle();

      if (!prod) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      resolvedProductId = prod.id;
    }

    const productIdForReserve = resolvedProductId;
    if (!productIdForReserve) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { available } = await getVariantAvailability(supabase, productIdForReserve, size);
    if (available <= 0) {
      return NextResponse.json({ error: 'Size sold out' }, { status: 409 });
    }

    const reserveResult = await reserveVariant(supabase, productIdForReserve, size, 1);
    if (!reserveResult.ok) {
      return NextResponse.json({ error: 'Size just sold out — try another' }, { status: 409 });
    }

    const { error: insertError } = await supabase.from('preorders').insert({
      name,
      email,
      phone: phone || null,
      product,
      size,
    });

    if (insertError) {
      console.error('[preorders] Supabase insert error:', insertError);
      const variant = await resolveVariant(supabase, productIdForReserve, size);
      if (variant) {
        await supabase
          .from('product_variants')
          .update({ reserved: Math.max(0, variant.reserved - 1) })
          .eq('id', variant.id);
      }
      return NextResponse.json({ error: 'Failed to save reservation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[preorders/create]', error);
    return NextResponse.json({ error: 'Failed to save prebook' }, { status: 500 });
  }
}
