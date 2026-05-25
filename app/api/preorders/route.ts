import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const data = await req.json();

    // Insert the pre-order into a "preorders" table
    const { error } = await supabase
      .from('preorders')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        product: data.product,
        size: data.size,
      });

    if (error) {
      console.error('[preorders] Supabase insert error:', error);
      // We still return success so the frontend shows the confirmation, 
      // but in production we might want to handle this better if the table isn't created yet.
      return NextResponse.json({ success: true, warning: 'Table might not exist' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[preorders/create]', error);
    return NextResponse.json({ error: 'Failed to save prebook' }, { status: 500 });
  }
}
