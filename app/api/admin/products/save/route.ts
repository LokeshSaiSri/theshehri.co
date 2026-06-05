import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const {
    id,
    name,
    slug,
    price,
    description,
    images,
    color_images,
    fabric_info,
    fit_notes,
    is_active,
    drop_id,
    variants,
  } = body;

  try {
    let productId = id;
    const safeColorImages = color_images && typeof color_images === 'object' ? color_images : {};
    const safeVariants = Array.isArray(variants) ? variants : [];

    if (id === 'new') {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          slug,
          price,
          description,
          images,
          color_images: safeColorImages,
          fabric_info,
          fit_notes,
          is_active,
          drop_id,
        })
        .select()
        .single();
      if (error) throw error;
      productId = data.id;
    } else {
      const { error } = await supabase
        .from('products')
        .update({
          name,
          slug,
          price,
          description,
          images,
          color_images: safeColorImages,
          fabric_info,
          fit_notes,
          is_active,
          drop_id,
        })
        .eq('id', productId);
      if (error) throw error;
    }

    const { data: existingVariants, error: fetchError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);

    if (fetchError) throw fetchError;

    const existingIds = (existingVariants || []).map((v) => v.id);
    const keptIds = safeVariants
      .filter((v) => v.id && !String(v.id).startsWith('new_'))
      .map((v) => v.id);

    const toDelete = existingIds.filter((variantId) => !keptIds.includes(variantId));
    if (toDelete.length > 0) {
      const { error: historyError } = await supabase
        .from('stock_history')
        .delete()
        .in('variant_id', toDelete);
      if (historyError) throw historyError;

      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', toDelete);
      if (deleteError) throw deleteError;
    }

    for (const variant of safeVariants) {
      const vData = {
        product_id: productId,
        size: variant.size,
        color: variant.color || null,
        sku: variant.sku,
        stock: variant.stock || 0,
        reserved: variant.reserved || 0,
      };

      if (variant.id && !String(variant.id).startsWith('new_')) {
        const { error: updateError } = await supabase
          .from('product_variants')
          .update(vData)
          .eq('id', variant.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert(vData);
        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error('Error saving product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
