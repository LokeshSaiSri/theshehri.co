import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { resolveVariant } from '@/lib/inventory';

type VariantRow = { id: string; product_id: string; size: string; color?: string | null };

function matchVariant(
  variants: VariantRow[],
  productId: string,
  size: string,
  color?: string | null
): VariantRow | null {
  const candidates = variants.filter(v => v.product_id === productId && v.size === size);
  if (!candidates.length) return null;
  if (color) {
    const exact = candidates.find(v => v.color === color);
    if (exact) return exact;
  }
  const blank = candidates.find(v => !v.color);
  return blank ?? candidates[0];
}

/**
 * One-time / occasional repair: set each variant's `reserved` from paid orders + preorders.
 */
export async function POST() {
  const supabase = createServerClient();

  const [{ data: variants }, { data: orderItems }, { data: preorders }, { data: products }] =
    await Promise.all([
      supabase.from('product_variants').select('id, product_id, size, color'),
      supabase
        .from('order_items')
        .select('product_id, size, quantity, color, order:orders!inner(payment_status)')
        .eq('order.payment_status', 'paid'),
      supabase.from('preorders').select('product, size'),
      supabase.from('products').select('id, name'),
    ]);

  if (!variants) {
    return NextResponse.json({ error: 'Failed to load variants' }, { status: 500 });
  }

  const productNameToId = Object.fromEntries((products ?? []).map(p => [p.name, p.id]));
  const reservedByVariant = new Map<string, number>();

  for (const v of variants) {
    reservedByVariant.set(v.id, 0);
  }

  for (const item of orderItems ?? []) {
    const variant = matchVariant(
      variants,
      item.product_id,
      item.size,
      item.color
    );
    if (!variant) continue;
    reservedByVariant.set(
      variant.id,
      (reservedByVariant.get(variant.id) ?? 0) + (item.quantity ?? 1)
    );
  }

  for (const pre of preorders ?? []) {
    const productId = pre.product ? productNameToId[pre.product] : undefined;
    if (!productId || !pre.size) continue;
    const variant = await resolveVariant(supabase, productId, pre.size);
    if (!variant) continue;
    reservedByVariant.set(variant.id, (reservedByVariant.get(variant.id) ?? 0) + 1);
  }

  const updates = await Promise.all(
    variants.map(v =>
      supabase
        .from('product_variants')
        .update({ reserved: reservedByVariant.get(v.id) ?? 0 })
        .eq('id', v.id)
    )
  );

  const failed = updates.find(r => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    variantsUpdated: variants.length,
    reservedTotals: Object.fromEntries(
      variants.map(v => [v.id, reservedByVariant.get(v.id) ?? 0])
    ),
  });
}
