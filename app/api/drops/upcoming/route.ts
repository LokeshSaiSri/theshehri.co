import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('drops')
    .select('*')
    .eq('is_active', true)
    .order('launch_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // single() throws an error if no rows are found, which is fine, just return null.
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}
