import { NextResponse } from 'next/server';
import { getRazorpayKeyId } from '@/lib/razorpay';

/** Returns the publishable Razorpay key for checkout.js (safe for the browser). */
export async function GET() {
  try {
    return NextResponse.json({ keyId: getRazorpayKeyId() });
  } catch {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 });
  }
}
