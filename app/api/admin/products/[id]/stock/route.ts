import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// PATCH /api/admin/products/[id]/stock
// Body: { variants: [{ id: string, stock: number }] }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { variants } = await req.json();

  // Get current stock values for history
  const { data: currentVariants } = await supabase
    .from('product_variants')
    .select('id, stock')
    .eq('product_id', id);

  const currentMap = Object.fromEntries((currentVariants ?? []).map(v => [v.id, v.stock]));

  // Update each variant stock
  const updates = await Promise.all(
    variants.map(async (v: { id: string; stock: number }) => {
      const prev = currentMap[v.id] ?? 0;

      // Log to stock history
      await supabase.from('stock_history').insert({
        variant_id:     v.id,
        previous_stock: prev,
        new_stock:      v.stock,
        changed_by:     'admin',
        note:           `Manual update: ${prev} → ${v.stock}`,
      });

      return supabase
        .from('product_variants')
        .update({ stock: v.stock })
        .eq('id', v.id);
    })
  );

  const hasError = updates.some(u => u.error);
  if (hasError) return NextResponse.json({ error: 'Some updates failed' }, { status: 500 });

  return NextResponse.json({ success: true });
}
