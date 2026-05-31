import { jsPDF } from 'jspdf';

export type PackingSlipOrder = {
  order_number: string;
  created_at: string;
  tracking_number?: string | null;
  customer: {
    name: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    product_name: string;
    size: string;
    color?: string | null;
    quantity: number;
  }[];
};

function drawSlip(doc: jsPDF, order: PackingSlipOrder) {
  const margin = 14;
  let y = margin;

  // Wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(25, 23, 20);
  doc.text('THE SHEHRI CO.', margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(192, 78, 24);
  doc.text('DELHI NCR · BATCH 001', margin, y);
  y += 10;

  doc.setDrawColor(206, 200, 191);
  doc.line(margin, y, 148 - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(25, 23, 20);
  doc.text(order.order_number, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(dateStr, 148 - margin, y, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('SHIP TO', margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(25, 23, 20);
  doc.text(order.customer.name, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addressLines = [
    order.customer.address_line1,
    order.customer.address_line2,
    `${order.customer.city}, ${order.customer.state}`,
    order.customer.pincode,
  ].filter(Boolean) as string[];

  for (const line of addressLines) {
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('ITEMS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(25, 23, 20);

  for (const item of order.items) {
    const variant = [item.color, `Size ${item.size}`].filter(Boolean).join(' · ');
    doc.text(`${item.product_name}`, margin, y);
    y += 4;
    doc.setTextColor(100, 100, 100);
    doc.text(`${variant} · Qty ${item.quantity}`, margin + 2, y);
    doc.setTextColor(25, 23, 20);
    y += 7;
  }

  if (order.tracking_number) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('TRACKING', margin, y);
    y += 5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(25, 23, 20);
    doc.text(order.tracking_number, margin, y);
    y += 8;
  }

  y = Math.max(y + 6, 175);
  doc.setDrawColor(206, 200, 191);
  doc.line(margin, y, 148 - margin, y);
  y += 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Thank you for supporting Shehri Co. — Batch 001', margin, y, {
    maxWidth: 148 - margin * 2,
  });
}

export function downloadPackingSlipPDF(orders: PackingSlipOrder[], filename: string) {
  if (orders.length === 0) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

  orders.forEach((order, i) => {
    if (i > 0) doc.addPage('a5', 'portrait');
    drawSlip(doc, order);
  });

  doc.save(filename);
}

export function orderToPackingSlip(order: {
  order_number: string;
  created_at: string;
  tracking_number?: string | null;
  customer: PackingSlipOrder['customer'];
  items: PackingSlipOrder['items'];
}): PackingSlipOrder {
  return {
    order_number: order.order_number,
    created_at: order.created_at,
    tracking_number: order.tracking_number,
    customer: order.customer,
    items: order.items.map((i) => ({
      product_name: i.product_name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    })),
  };
}
