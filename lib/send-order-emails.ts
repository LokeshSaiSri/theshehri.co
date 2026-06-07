import { Resend } from 'resend';
import { SITE_CONTACT } from '@/lib/site-contact';

const resend = new Resend(process.env.RESEND_API_KEY!);

export type OrderEmailPayload = {
  order_number: string;
  subtotal: number;
  shipping: number;
  total: number;
  delivery_note: string | null;
  payment_status?: 'paid' | 'pending';
  customer: {
    name: string;
    phone: string;
    email: string | null;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    product_name: string;
    size: string;
    color: string | null;
    price: number;
    quantity?: number;
  }[];
};

export type SendOrderEmailsResult = {
  customerSent: boolean;
  ownerSent: boolean;
  error?: string;
};

export async function sendOrderEmails(
  orderId: string,
  order: OrderEmailPayload
): Promise<SendOrderEmailsResult> {
  if (!process.env.RESEND_API_KEY || !process.env.SENDER_EMAIL) {
    return {
      customerSent: false,
      ownerSent: false,
      error: 'Email is not configured (RESEND_API_KEY / SENDER_EMAIL)',
    };
  }

  const customerEmail = order.customer.email?.trim();
  if (!customerEmail) {
    return { customerSent: false, ownerSent: false, error: 'Customer email is missing' };
  }

  const isPaid = order.payment_status !== 'pending';
  const totalLabel = isPaid ? 'Total Paid' : 'Total';

  const itemLines = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#191714;">${i.product_name}</td>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#888;">${i.color ? i.color + ' · ' : ''}Size ${i.size}${(i.quantity ?? 1) > 1 ? ` · Qty ${i.quantity}` : ''}</td>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#191714;text-align:right;">₹${Number(i.price * (i.quantity ?? 1)).toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order: ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #CEC8BF;">
    <div style="background:#191714;padding:24px 32px;">
      <p style="margin:0;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:2px;">NEW ORDER 🧾</p>
    </div>
    <div style="background:#C04E18;padding:12px 32px;">
      <p style="margin:0;color:#ffffff;font-size:14px;font-family:monospace;letter-spacing:2px;">${order.order_number}</p>
    </div>
    <div style="padding:28px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Customer</p>
      <p style="margin:0 0 2px;font-size:16px;font-weight:bold;color:#191714;">${order.customer.name}</p>
      <p style="margin:0 0 2px;font-size:13px;color:#555;font-family:monospace;">
        <a href="https://wa.me/91${order.customer.phone}" style="color:#C04E18;text-decoration:none;">
          +91 ${order.customer.phone} (WhatsApp ↗)
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#555;font-family:monospace;">${order.customer.email}</p>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Ship To</p>
      <p style="margin:0;font-size:13px;color:#191714;font-family:monospace;line-height:1.8;">
        ${order.customer.address_line1 || '—'}${order.customer.address_line2 ? '<br>' + order.customer.address_line2 : ''}<br>
        ${order.customer.city || '—'}${order.customer.state ? ', ' + order.customer.state : ''}${order.customer.pincode ? ' — ' + order.customer.pincode : ''}
      </p>
      ${order.delivery_note ? `<p style="margin:8px 0 0;font-size:12px;color:#888;font-family:monospace;">Note: ${order.delivery_note}</p>` : ''}
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Items</p>
      <table style="width:100%;border-collapse:collapse;">${itemLines}</table>
    </div>
    <div style="padding:20px 32px;border-bottom:1px solid #EFEAE2;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:#888;font-family:monospace;padding:3px 0;">Subtotal</td>
          <td style="font-size:12px;color:#191714;font-family:monospace;text-align:right;padding:3px 0;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;font-family:monospace;padding:3px 0;">Shipping</td>
          <td style="font-size:12px;color:#191714;font-family:monospace;text-align:right;padding:3px 0;">${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</td>
        </tr>
        <tr>
          <td style="font-size:14px;font-weight:bold;color:#191714;font-family:monospace;padding-top:8px;">TOTAL</td>
          <td style="font-size:14px;font-weight:bold;color:#C04E18;font-family:monospace;text-align:right;padding-top:8px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}"
         style="display:inline-block;background:#191714;color:#ffffff;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">
        View in Admin →
      </a>
    </div>
  </div>
</body>
</html>`;

  const customerItemLines = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#191714;">${i.product_name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#888;">${i.color ? i.color + ' · ' : ''}Size ${i.size}${(i.quantity ?? 1) > 1 ? ` · Qty ${i.quantity}` : ''}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#191714;text-align:right;">₹${Number(i.price * (i.quantity ?? 1)).toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('');

  const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed — ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #CEC8BF;">
    <div style="background:#191714;padding:28px 32px;">
      <p style="margin:0;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Order Confirmed ✓</p>
    </div>
    <div style="background:#C04E18;padding:10px 32px;">
      <p style="margin:0;color:#ffffff;font-size:13px;font-family:monospace;letter-spacing:2px;">${order.order_number}</p>
    </div>
    <div style="padding:28px 32px 0;">
      <p style="margin:0;font-size:15px;color:#191714;font-weight:bold;">Hey ${order.customer.name.split(' ')[0]},</p>
      <p style="margin:10px 0 0;font-size:13px;color:#888;font-family:monospace;line-height:1.8;">
        Your order is confirmed. We're packing it up and will WhatsApp you on
        <strong style="color:#191714;">+91 ${order.customer.phone}</strong> when it ships.
      </p>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Your Items</p>
      <table style="width:100%;border-collapse:collapse;">${customerItemLines}</table>
    </div>
    <div style="padding:20px 32px;border-bottom:1px solid #EFEAE2;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:#888;font-family:monospace;padding:3px 0;">Subtotal</td>
          <td style="font-size:12px;color:#191714;font-family:monospace;text-align:right;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;font-family:monospace;padding:3px 0;">Shipping</td>
          <td style="font-size:12px;color:#191714;font-family:monospace;text-align:right;">${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</td>
        </tr>
        <tr>
          <td style="font-size:14px;font-weight:bold;color:#191714;font-family:monospace;padding-top:10px;">${totalLabel}</td>
          <td style="font-size:14px;font-weight:bold;color:#C04E18;font-family:monospace;text-align:right;padding-top:10px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Delivering To</p>
      <p style="margin:0;font-size:13px;color:#191714;font-family:monospace;line-height:1.8;">
        ${order.customer.address_line1 || '—'}${order.customer.address_line2 ? '<br>' + order.customer.address_line2 : ''}<br>
        ${order.customer.city || '—'}${order.customer.state ? ', ' + order.customer.state : ''}${order.customer.pincode ? ' — ' + order.customer.pincode : ''}
      </p>
    </div>
    <div style="background:#191714;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 4px;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:0;color:#888;font-size:10px;font-family:monospace;">EST. ${SITE_CONTACT.foundedYear} · DELHI NCR · Fit With No Logo</p>
    </div>
  </div>
</body>
</html>`;

  const FROM = `The Shehri Co. <${process.env.SENDER_EMAIL}>`;
  let ownerSent = false;
  let customerSent = false;
  let error: string | undefined;

  if (process.env.OWNER_EMAIL) {
    const ownerResult = await resend.emails.send({
      from: FROM,
      to: [process.env.OWNER_EMAIL],
      subject: `🧾 New Order: ${order.order_number} — ₹${Number(order.total).toLocaleString('en-IN')} — ${order.customer.name}`,
      html: emailHtml,
    });
    if (ownerResult.error) {
      console.error('[send-order-emails] Owner email error:', ownerResult.error);
      error = ownerResult.error.message;
    } else {
      ownerSent = true;
    }
  }

  const customerResult = await resend.emails.send({
    from: FROM,
    to: [customerEmail],
    subject: `✓ Order Confirmed: ${order.order_number} — The Shehri Co.`,
    html: customerEmailHtml,
  });
  if (customerResult.error) {
    console.error('[send-order-emails] Customer email error:', customerResult.error);
    error = customerResult.error.message;
  } else {
    customerSent = true;
  }

  return { customerSent, ownerSent, error };
}
