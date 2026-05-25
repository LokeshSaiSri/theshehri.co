import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('drops')
    .select('*, products(id, name), drop_subscribers(id)')
    .order('launch_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Format response to include subscriber count
  const drops = (data || []).map((d: any) => ({
    ...d,
    subscriberCount: d.drop_subscribers?.length || 0,
    products: d.products || []
  }));

  return NextResponse.json(drops);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('drops')
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
