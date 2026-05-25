import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { orderId } = await req.json();

    // 1. Mark order as paid
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status:         'processing',
        payment_status: 'paid',
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature:  'mock_signature',
      })
      .eq('id', orderId)
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .single();

    if (orderError) throw orderError;

    // 2. Update customer stats
    await supabase.rpc('increment_customer_stats', {
      p_customer_id: order.customer_id,
      p_total:       order.total,
    }).then(() => {
      // fallback if RPC doesn't exist yet — do it manually
    });

    // Manually update customer stats (always safe)
    await supabase
      .from('customers')
      .update({ last_ordered_at: new Date().toISOString() })
      .eq('id', order.customer_id);

    // 3. Send owner notification email
    const itemLines = order.items
      .map((i: { product_name: string; size: string; color: string | null; price: number }) =>
        `<tr>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#191714;">${i.product_name}</td>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#888;">${i.color ? i.color + ' · ' : ''}Size ${i.size}</td>
          <td style="padding:8px 0;font-family:monospace;font-size:13px;color:#191714;text-align:right;">₹${Number(i.price).toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order: ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #CEC8BF;">
    
    <!-- Header -->
    <div style="background:#191714;padding:24px 32px;">
      <p style="margin:0;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:2px;">NEW ORDER 🧾</p>
    </div>

    <!-- Order number -->
    <div style="background:#C04E18;padding:12px 32px;">
      <p style="margin:0;color:#ffffff;font-size:14px;font-family:monospace;letter-spacing:2px;">${order.order_number}</p>
    </div>

    <!-- Customer -->
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

    <!-- Ship to -->
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Ship To</p>
      <p style="margin:0;font-size:13px;color:#191714;font-family:monospace;line-height:1.8;">
        ${order.customer.address_line1}${order.customer.address_line2 ? '<br>' + order.customer.address_line2 : ''}<br>
        ${order.customer.city}, ${order.customer.state} — ${order.customer.pincode}
      </p>
      ${order.delivery_note ? `<p style="margin:8px 0 0;font-size:12px;color:#888;font-family:monospace;">Note: ${order.delivery_note}</p>` : ''}
    </div>

    <!-- Items -->
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Items</p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemLines}
      </table>
    </div>

    <!-- Totals -->
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

    <!-- CTA -->
    <div style="padding:24px 32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}"
         style="display:inline-block;background:#191714;color:#ffffff;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">
        View in Admin →
      </a>
      <a href="https://wa.me/91${order.customer.phone}"
         style="display:inline-block;margin-left:12px;background:#25D366;color:#ffffff;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">
        WhatsApp Customer →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#EFEAE2;padding:16px 32px;">
      <p style="margin:0;font-size:10px;color:#888;font-family:monospace;letter-spacing:1px;">
        THE SHEHRI CO. · DELHI NCR · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  </div>
</body>
</html>`;

    // Sending from the newly verified domain via Resend
    const FROM = `The Shehri Co. <${process.env.SENDER_EMAIL!}>`;

    // ── Email 1: Owner notification ──────────────────────────────────────────
    const ownerResult = await resend.emails.send({
      from:    FROM,
      to:      [process.env.OWNER_EMAIL!],
      subject: `🧾 New Order: ${order.order_number} — ₹${Number(order.total).toLocaleString('en-IN')} — ${order.customer.name}`,
      html:    emailHtml,
    });

    if (ownerResult.error) {
      console.error('[orders/confirm] Owner email error:', JSON.stringify(ownerResult.error));
    } else {
      console.log('[orders/confirm] Owner email sent:', ownerResult.data?.id);
    }

    // ── Email 2: Customer confirmation ───────────────────────────────────────
    const customerItemLines = order.items
      .map((i: { product_name: string; size: string; color: string | null; price: number }) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#191714;">${i.product_name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#888;">${i.color ? i.color + ' · ' : ''}Size ${i.size}</td>
          <td style="padding:10px 0;border-bottom:1px solid #EFEAE2;font-family:monospace;font-size:13px;color:#191714;text-align:right;">₹${Number(i.price).toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmed — ${order.order_number}</title></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #CEC8BF;">

    <!-- Header -->
    <div style="background:#191714;padding:28px 32px;">
      <p style="margin:0;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">Order Confirmed ✓</p>
    </div>

    <!-- Order number strip -->
    <div style="background:#C04E18;padding:10px 32px;">
      <p style="margin:0;color:#ffffff;font-size:13px;font-family:monospace;letter-spacing:2px;">${order.order_number}</p>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 0;">
      <p style="margin:0;font-size:15px;color:#191714;font-weight:bold;">Hey ${order.customer.name.split(' ')[0]},</p>
      <p style="margin:10px 0 0;font-size:13px;color:#888;font-family:monospace;line-height:1.8;">
        Your order is confirmed. We're packing it up and will WhatsApp you on
        <strong style="color:#191714;">+91 ${order.customer.phone}</strong> when it ships.
      </p>
    </div>

    <!-- Items -->
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Your Items</p>
      <table style="width:100%;border-collapse:collapse;">
        ${customerItemLines}
      </table>
    </div>

    <!-- Totals -->
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
          <td style="font-size:14px;font-weight:bold;color:#191714;font-family:monospace;padding-top:10px;">Total Paid</td>
          <td style="font-size:14px;font-weight:bold;color:#C04E18;font-family:monospace;text-align:right;padding-top:10px;">₹${Number(order.total).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <!-- Delivery address -->
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">Delivering To</p>
      <p style="margin:0;font-size:13px;color:#191714;font-family:monospace;line-height:1.8;">
        ${order.customer.address_line1}${order.customer.address_line2 ? '<br>' + order.customer.address_line2 : ''}<br>
        ${order.customer.city}, ${order.customer.state} — ${order.customer.pincode}
      </p>
    </div>

    <!-- What's next -->
    <div style="padding:24px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0 0 14px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;">What Happens Next</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:28px;font-size:14px;font-weight:bold;color:#C04E18;vertical-align:top;padding:4px 12px 4px 0;font-family:monospace;">01</td>
          <td style="font-size:13px;color:#888;font-family:monospace;padding:4px 0;line-height:1.6;">We pack your order within 24 hours.</td>
        </tr>
        <tr>
          <td style="width:28px;font-size:14px;font-weight:bold;color:#C04E18;vertical-align:top;padding:4px 12px 4px 0;font-family:monospace;">02</td>
          <td style="font-size:13px;color:#888;font-family:monospace;padding:4px 0;line-height:1.6;">WhatsApp tracking link sent to +91 ${order.customer.phone}.</td>
        </tr>
        <tr>
          <td style="width:28px;font-size:14px;font-weight:bold;color:#C04E18;vertical-align:top;padding:4px 12px 4px 0;font-family:monospace;">03</td>
          <td style="font-size:13px;color:#888;font-family:monospace;padding:4px 0;line-height:1.6;">Delivered in 5–7 days. Delhi NCR usually faster.</td>
        </tr>
      </table>
    </div>

    <!-- Returns + contact -->
    <div style="padding:20px 32px;border-bottom:1px solid #EFEAE2;">
      <p style="margin:0;font-size:12px;color:#888;font-family:monospace;line-height:1.8;">
        Questions? DM us on <a href="https://instagram.com/theshehrico" style="color:#C04E18;">Instagram @theshehrico</a> or reply to this email.<br>
        Returns are handled via DM only. No discounts. No restocks.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#191714;padding:20px 32px;text-align:center;">
      <p style="margin:0 0 4px;color:#CEC8BF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">The Shehri Co.</p>
      <p style="margin:0;color:#888;font-size:10px;font-family:monospace;">EST. 2025 · DELHI NCR · Fit With No Logo</p>
    </div>
  </div>
</body>
</html>`;

    // Send to customer (requires verified domain to reach real customer emails)
    const customerResult = await resend.emails.send({
      from:    FROM,
      to:      [order.customer.email],
      subject: `✓ Order Confirmed: ${order.order_number} — The Shehri Co.`,
      html:    customerEmailHtml,
    });

    if (customerResult.error) {
      // Non-fatal — customer email fails in test mode if email ≠ Resend signup email
      console.error('[orders/confirm] Customer email error:', JSON.stringify(customerResult.error));
    } else {
      console.log('[orders/confirm] Customer email sent:', customerResult.data?.id);
    }

    return NextResponse.json({ success: true, orderNumber: order.order_number });
  } catch (error) {
    console.error('[orders/confirm] Fatal error:', error);
    return NextResponse.json({ error: 'Failed to confirm order' }, { status: 500 });
  }
}
