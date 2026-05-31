import type { SupabaseClient } from '@supabase/supabase-js';

type VariantRow = { id: string; stock: number; reserved: number; color?: string | null };

async function loadSizeVariants(
  supabase: SupabaseClient,
  productId: string,
  size: string
): Promise<VariantRow[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, stock, reserved, color')
    .eq('product_id', productId)
    .eq('size', size);

  if (error || !data?.length) return [];
  return data;
}

/** Pick the variant row for a cart line (color-aware; falls back to first in-stock row). */
export async function resolveVariant(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  color?: string | null
): Promise<VariantRow | null> {
  const candidates = await loadSizeVariants(supabase, productId, size);
  if (!candidates.length) return null;

  if (color) {
    const exact = candidates.find(v => v.color === color);
    if (exact) return exact;
  }

  const blankColor = candidates.find(v => !v.color);
  if (blankColor) return blankColor;

  const inStock = candidates.find(v => v.stock - v.reserved > 0);
  return inStock ?? candidates[0];
}

export async function getVariantAvailability(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  color?: string | null
): Promise<{ available: number; variant: VariantRow | null }> {
  const variant = await resolveVariant(supabase, productId, size, color);
  if (!variant) return { available: 0, variant: null };
  return { available: Math.max(0, variant.stock - variant.reserved), variant };
}

export async function reserveVariant(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  quantity = 1,
  color?: string | null
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'sold_out' | 'conflict' }> {
  const { available, variant } = await getVariantAvailability(supabase, productId, size, color);
  if (!variant) return { ok: false, reason: 'not_found' };
  if (available < quantity) return { ok: false, reason: 'sold_out' };

  const { data: updated, error } = await supabase
    .from('product_variants')
    .update({ reserved: variant.reserved + quantity })
    .eq('id', variant.id)
    .eq('reserved', variant.reserved)
    .select('id')
    .maybeSingle();

  if (error || !updated) return { ok: false, reason: 'conflict' };
  return { ok: true };
}

export async function releaseVariant(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  quantity = 1,
  color?: string | null
): Promise<void> {
  const variant = await resolveVariant(supabase, productId, size, color);
  if (!variant) return;

  await supabase
    .from('product_variants')
    .update({ reserved: Math.max(0, variant.reserved - quantity) })
    .eq('id', variant.id);
}

export type OrderItemForInventory = {
  product_id: string;
  size: string;
  quantity?: number;
  color?: string | null;
};

export async function releaseOrderItems(
  supabase: SupabaseClient,
  items: OrderItemForInventory[]
): Promise<void> {
  for (const item of items) {
    await releaseVariant(
      supabase,
      item.product_id,
      item.size,
      item.quantity ?? 1,
      item.color
    );
  }
}

export async function reserveOrderItems(
  supabase: SupabaseClient,
  items: OrderItemForInventory[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const applied: { productId: string; size: string; quantity: number; color?: string | null }[] = [];

  for (const item of items) {
    const quantity = item.quantity ?? 1;
    const result = await reserveVariant(
      supabase,
      item.product_id,
      item.size,
      quantity,
      item.color
    );
    if (!result.ok) {
      for (const row of applied) {
        await releaseVariant(supabase, row.productId, row.size, row.quantity, row.color);
      }
      const message =
        result.reason === 'sold_out'
          ? 'An item in this order just sold out'
          : result.reason === 'not_found'
            ? 'Product size not found'
            : 'Inventory update conflict — try again';
      return { ok: false, message };
    }
    applied.push({
      productId: item.product_id,
      size: item.size,
      quantity,
      color: item.color,
    });
  }

  return { ok: true };
}
