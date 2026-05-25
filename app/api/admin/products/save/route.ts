import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { id, name, slug, price, description, images, fabric_info, fit_notes, is_active, drop_id, variants } = body;

  try {
    let productId = id;

    if (id === 'new') {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name, slug, price, description, images, fabric_info, fit_notes, is_active, drop_id
        })
        .select()
        .single();
      if (error) throw error;
      productId = data.id;
    } else {
      const { error } = await supabase
        .from('products')
        .update({
          name, slug, price, description, images, fabric_info, fit_notes, is_active, drop_id
        })
        .eq('id', productId);
      if (error) throw error;
    }

    // Process variants
    if (variants && Array.isArray(variants)) {
      // Get existing variants
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId);
        
      const existingIds = (existingVariants || []).map(v => v.id);
      const newIds = variants.filter(v => v.id && !v.id.startsWith('new_')).map(v => v.id);
      
      // Delete variants not in the new list
      const toDelete = existingIds.filter(id => !newIds.includes(id));
      if (toDelete.length > 0) {
        await supabase.from('product_variants').delete().in('id', toDelete);
      }

      // Upsert current variants
      for (const variant of variants) {
        const vData = {
          product_id: productId,
          size: variant.size,
          color: variant.color || null,
          sku: variant.sku,
          stock: variant.stock || 0,
          reserved: variant.reserved || 0
        };

        if (variant.id && !variant.id.startsWith('new_')) {
          await supabase.from('product_variants').update(vData).eq('id', variant.id);
        } else {
          await supabase.from('product_variants').insert(vData);
        }
      }
    }

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error('Error saving product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
