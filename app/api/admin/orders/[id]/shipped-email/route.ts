import { NextRequest, NextResponse } from 'next/server';
import { sendShippedEmail } from '@/lib/send-shipped-email';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await sendShippedEmail(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
