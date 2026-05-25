import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { drop_id, email, phone } = await req.json();
    
    if (!drop_id || (!email && !phone)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('drop_subscribers')
      .insert({ drop_id, email, phone });

    // Handle unique constraint error silently as a success for the user
    if (error && error.code !== '23505') {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
