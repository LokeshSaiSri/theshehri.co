import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getVariantAvailability } from '@/lib/inventory';

/** Live stock for a variant — used by manual order form */
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const size = searchParams.get('size');
  const color = searchParams.get('color');

  if (!productId || !size) {
    return NextResponse.json({ error: 'productId and size required' }, { status: 400 });
  }

  const { available, variant } = await getVariantAvailability(
    supabase,
    productId,
    size,
    color || null
  );

  return NextResponse.json({
    available,
    variantId: variant?.id ?? null,
  });
}
