import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { is_launched } = await req.json();

    // Upsert the launch status in store_settings
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 'is_launched',
        value: String(is_launched) // Store as string "true" or "false"
      });

    if (error) {
      console.error('[launch] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_launched });
  } catch (error) {
    console.error('[launch]', error);
    return NextResponse.json({ error: 'Failed to update launch status' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createServerClient();
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('id', 'is_launched')
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
      console.error('[launch GET] Supabase error:', error);
      return NextResponse.json({ is_launched: false });
    }
    
    return NextResponse.json({ is_launched: data?.value === 'true' });
  } catch (error) {
    return NextResponse.json({ is_launched: false });
  }
}
