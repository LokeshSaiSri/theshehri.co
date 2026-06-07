import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, currency = 'INR', receipt } = body as {
      orderId?: string;
      amount?: number;
      currency?: string;
      receipt?: string;
    };

    let amountPaise: number;
    let receiptId: string;

    if (orderId) {
      const supabase = createServerClient();
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, total, order_number, payment_status')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.payment_status === 'paid') {
        return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
      }

      amountPaise = order.total * 100;
      receiptId = order.order_number;

      if (typeof amount === 'number' && amount !== amountPaise) {
        return NextResponse.json({ error: 'Amount mismatch for order' }, { status: 400 });
      }
    } else {
      if (typeof amount !== 'number' || !Number.isInteger(amount)) {
        return NextResponse.json({ error: 'amount is required (integer, paise)' }, { status: 400 });
      }
      if (amount < 100) {
        return NextResponse.json({ error: 'Minimum amount is 100 paise' }, { status: 400 });
      }
      amountPaise = amount;
      receiptId = receipt || `rcpt_${Date.now()}`;
    }

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: receiptId,
    });

    if (orderId) {
      const supabase = createServerClient();
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', orderId);
    }

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: unknown) {
    console.error('[create-order]', error);

    const statusCode =
      error && typeof error === 'object' && 'statusCode' in error
        ? Number((error as { statusCode: number }).statusCode)
        : 500;

    if (statusCode === 401) {
      return NextResponse.json(
        {
          error:
            'Razorpay authentication failed. In Vercel → Settings → Environment Variables, set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID to the same live key pair from Razorpay Dashboard → Settings → API Keys, then redeploy.',
        },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.includes('RAZORPAY')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
