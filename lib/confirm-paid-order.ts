import { createServerClient } from '@/lib/supabase/server';
import { reserveOrderItems, releaseOrderItems } from '@/lib/inventory';
import { sendOrderEmails } from '@/lib/send-order-emails';

export type RazorpayPaymentDetails = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type ConfirmResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; status: number };

export async function confirmPaidOrder(
  orderId: string,
  payment: RazorpayPaymentDetails
): Promise<ConfirmResult> {
  const supabase = createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: 'Order not found', status: 404 };
  }

  if (existing.payment_status === 'paid') {
    return { ok: true, orderNumber: existing.order_number };
  }

  if (
    existing.razorpay_order_id &&
    existing.razorpay_order_id !== payment.razorpay_order_id
  ) {
    return { ok: false, error: 'Payment order mismatch', status: 400 };
  }

  const reserveResult = await reserveOrderItems(supabase, existing.items);
  if (!reserveResult.ok) {
    return { ok: false, error: reserveResult.message, status: 409 };
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'processing',
      payment_status: 'paid',
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .select(`
      *,
      customer:customers(*),
      items:order_items(*)
    `)
    .single();

  if (orderError || !order) {
    await releaseOrderItems(supabase, existing.items);
    return {
      ok: false,
      error: 'Order was already processed or could not be confirmed',
      status: 409,
    };
  }

  await supabase.rpc('increment_customer_stats', {
    p_customer_id: order.customer_id,
    p_total: order.total,
  });

  await supabase
    .from('customers')
    .update({ last_ordered_at: new Date().toISOString() })
    .eq('id', order.customer_id);

  const emailResult = await sendOrderEmails(orderId, {
    ...order,
    payment_status: 'paid',
  });
  if (!emailResult.customerSent && emailResult.error) {
    console.error('[confirm-paid-order] Receipt email failed:', emailResult.error);
  }

  return { ok: true, orderNumber: order.order_number };
}
