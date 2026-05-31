import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { confirmPaidOrder } from '@/lib/confirm-paid-order';

/** @deprecated Prefer POST /api/verify-payment from checkout */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification required. Use /api/verify-payment.' },
        { status: 400 }
      );
    }

    if (
      !verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    ) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const result = await confirmPaidOrder(orderId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, orderNumber: result.orderNumber });
  } catch (error) {
    console.error('[orders/confirm]', error);
    return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
  }
}
