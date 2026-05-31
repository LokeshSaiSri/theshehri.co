import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withSortedVariantsList } from '@/lib/sizes';

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(withSortedVariantsList(data ?? []));
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('products')
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
