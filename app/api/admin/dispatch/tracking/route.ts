import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const TRACKING_RE = /^[A-Za-z0-9]{13}$/;

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updates = body.updates as { id: string; tracking_number: string }[] | undefined;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const supabase = createServerClient();
  const saved: string[] = [];

  for (const row of updates) {
    const tracking = row.tracking_number?.trim().toUpperCase();
    if (!tracking) continue;
    if (!TRACKING_RE.test(tracking)) {
      return NextResponse.json(
        { error: `Invalid tracking number for order ${row.id}: must be 13 alphanumeric characters` },
        { status: 400 }
      );
    }

    const indiaPostUrl = `https://www.indiapost.gov.in/Track/Tnt/TrackConsignment.aspx?ConsignmentNo=${encodeURIComponent(tracking)}`;

    const { error } = await supabase
      .from('orders')
      .update({
        tracking_number: tracking,
        tracking_url: indiaPostUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'processing');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    saved.push(row.id);
  }

  return NextResponse.json({ saved: saved.length, ids: saved });
}
