import { jsPDF } from 'jspdf';
import { SITE_CONTACT } from '@/lib/site-contact';

export type ReceiptOrder = {
  order_number: string;
  created_at: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  items: {
    product_name: string;
    size: string;
    color?: string | null;
    quantity: number;
    price: number;
  }[];
};

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function drawReceipt(doc: jsPDF, order: ReceiptOrder) {
  const margin = 14;
  const pageW = 148;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(25, 23, 20);
  doc.text('SHEHRI CO.', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(192, 78, 24);
  doc.text('Receipt', pageW - margin, y, { align: 'right' });
  y += 10;

  doc.setDrawColor(206, 200, 191);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  doc.text(`Receipt #${order.order_number}`, margin, y);
  doc.text(`Date: ${dateStr}`, margin, y + 4);

  const payMethod = (order.payment_method ?? 'cash').toUpperCase();
  const payStatus = order.payment_status === 'paid' ? 'Paid' : 'Pending';
  doc.text(`Payment: ${payMethod}`, pageW - margin, y, { align: 'right' });
  doc.text(`Status: ${payStatus}`, pageW - margin, y + 4, { align: 'right' });
  y += 14;

  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const cols = [margin, margin + 38, margin + 52, margin + 68, margin + 78, pageW - margin];
  doc.text('Product', cols[0], y);
  doc.text('Size', cols[1], y);
  doc.text('Color', cols[2], y);
  doc.text('Qty', cols[3], y);
  doc.text('Price', cols[4], y);
  doc.text('Total', cols[5], y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(25, 23, 20);

  for (const item of order.items) {
    const lineTotal = item.price * item.quantity;
    doc.text(item.product_name.slice(0, 22), cols[0], y);
    doc.text(item.size, cols[1], y);
    doc.text((item.color ?? '—').slice(0, 10), cols[2], y);
    doc.text(String(item.quantity), cols[3], y);
    doc.text(fmt(item.price), cols[4], y);
    doc.text(fmt(lineTotal), cols[5], y, { align: 'right' });
    y += 5;
  }

  y += 4;
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(9);
  const totalsX = pageW - margin - 45;
  doc.text('Subtotal:', totalsX, y);
  doc.text(fmt(order.subtotal), pageW - margin, y, { align: 'right' });
  y += 5;
  doc.text('Shipping:', totalsX, y);
  doc.text(order.shipping === 0 ? 'Free' : fmt(order.shipping), pageW - margin, y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total:', totalsX, y);
  doc.text(fmt(order.total), pageW - margin, y, { align: 'right' });
  y += 16;

  doc.setDrawColor(206, 200, 191);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Thank you for shopping with Shehri Co.', margin, y, {
    maxWidth: pageW - margin * 2,
  });
  y += 5;
  doc.text(`Questions? DM us ${SITE_CONTACT.instagramHandle} on Instagram`, margin, y);
  y += 4;
  doc.text('theshehri.co', margin, y);
}

export function downloadReceiptPDF(order: ReceiptOrder, filename?: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  drawReceipt(doc, order);
  doc.save(filename ?? `receipt-${order.order_number}.pdf`);
}

export function orderToReceipt(order: {
  order_number: string;
  created_at: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method?: string | null;
  payment_status: string;
  items: ReceiptOrder['items'];
}): ReceiptOrder {
  return {
    order_number: order.order_number,
    created_at: order.created_at,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    payment_method: order.payment_method ?? null,
    payment_status: order.payment_status,
    items: order.items.map((i) => ({
      product_name: i.product_name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
    })),
  };
}
