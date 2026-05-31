import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { SITE_CONTACT } from '@/lib/site-contact';

const resend = new Resend(process.env.RESEND_API_KEY!);

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theshehri.co';

export async function sendShippedEmail(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY || !process.env.SENDER_EMAIL) {
    return { ok: false, error: 'Email not configured' };
  }

  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, tracking_number, tracking_url,
      customer:customers(name, email, phone)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return { ok: false, error: 'Order not found' };
  }

  const rawCustomer = order.customer;
  const customer = (Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer) as {
    name: string;
    email: string;
    phone: string;
  } | null | undefined;
  if (!customer?.email) {
    return { ok: false, error: 'Customer email missing' };
  }

  const tracking = order.tracking_number;
  const trackPageUrl = `${SITE_URL}/track?order=${encodeURIComponent(order.order_number)}`;
  const indiaPostUrl = tracking
    ? `https://www.indiapost.gov.in/Track/Tnt/TrackConsignment.aspx?ConsignmentNo=${encodeURIComponent(tracking)}`
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your order has shipped — ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #CEC8BF;">
    <div style="background:#191714;padding:28px 32px;">
      <p style="margin:0;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Your order has shipped 🚚</p>
    </div>
    <div style="background:#C04E18;padding:10px 32px;">
      <p style="margin:0;color:#ffffff;font-size:13px;font-family:monospace;letter-spacing:2px;">${order.order_number}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0;font-size:15px;color:#191714;font-weight:bold;">Hey ${customer.name.split(' ')[0]},</p>
      <p style="margin:10px 0 0;font-size:13px;color:#888;font-family:monospace;line-height:1.8;">
        Your Batch 001 order is on its way via India Post Speed Post.
        Estimated delivery: <strong style="color:#191714;">2–4 business days</strong> from dispatch.
      </p>
      ${tracking ? `
      <div style="margin:20px 0;padding:16px;background:#F9FAFB;border:1px solid #EFEAE2;">
        <p style="margin:0 0 6px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Tracking Number</p>
        <p style="margin:0;font-size:15px;font-family:monospace;color:#191714;font-weight:bold;">${tracking}</p>
      </div>` : ''}
      <p style="margin:20px 0 0;">
        <a href="${trackPageUrl}" style="display:inline-block;background:#C04E18;color:#ffffff;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">
          Track your order →
        </a>
      </p>
      ${indiaPostUrl ? `
      <p style="margin:16px 0 0;">
        <a href="${indiaPostUrl}" style="font-size:12px;color:#C04E18;font-family:monospace;">Track on India Post →</a>
      </p>` : ''}
    </div>
    <div style="background:#191714;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 4px;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:0;color:#888;font-size:10px;font-family:monospace;">EST. ${SITE_CONTACT.foundedYear} · DELHI NCR · Fit With No Logo</p>
    </div>
  </div>
</body>
</html>`;

  const FROM = `The Shehri Co. <${process.env.SENDER_EMAIL}>`;
  const result = await resend.emails.send({
    from: FROM,
    to: [customer.email],
    subject: `🚚 Shipped: ${order.order_number} — The Shehri Co.`,
    html,
  });

  if (result.error) {
    console.error('[send-shipped-email]', result.error);
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}
