import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { confirmPaidOrder } from '@/lib/confirm-paid-order';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature' },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!valid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: order } = await supabase
      .from('orders')
      .select('razorpay_order_id, payment_status')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (
      order.razorpay_order_id &&
      order.razorpay_order_id !== razorpay_order_id
    ) {
      return NextResponse.json({ error: 'Razorpay order mismatch' }, { status: 400 });
    }

    const result = await confirmPaidOrder(orderId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
    });
  } catch (error) {
    console.error('[verify-payment]', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
