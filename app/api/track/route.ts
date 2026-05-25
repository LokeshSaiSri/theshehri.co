import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    await supabase.from('events').insert({
      session_id:   body.session_id   || null,
      event_type:   body.event_type,
      page:         body.page         || null,
      product_slug: body.product_slug || null,
      size:         body.size         || null,
      device:       body.device       || null,
      source:       body.source       || null,
      medium:       body.medium       || null,
      campaign:     body.campaign     || null,
      referrer:     body.referrer     || null,
      metadata:     body.metadata     || {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never fail a user request because of tracking
    return NextResponse.json({ ok: false });
  }
}
