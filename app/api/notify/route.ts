import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Insert the email into a "waitlist" table
    const { error } = await supabase
      .from('waitlist')
      .insert({ email });

    if (error) {
      console.error('[notify] Supabase insert error:', error);
      return NextResponse.json({ success: true, warning: 'Table might not exist' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notify/create]', error);
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }
}
