'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, MessageCircle, Loader2, Check, ExternalLink, Printer, FileDown } from 'lucide-react';
import { downloadPackingSlipPDF, orderToPackingSlip } from '@/lib/packing-slip-pdf';
import { downloadReceiptPDF, orderToReceipt } from '@/lib/receipt-pdf';

interface OrderItem {
  id: string; product_name: string; size: string; color: string | null; price: number; quantity: number;
  product: { name: string; slug: string; images: string[] };
}
interface OrderDetail {
  id: string; order_number: string; status: string; payment_status: string;
  subtotal: number; shipping: number; total: number; created_at: string;
  tracking_number: string | null; tracking_url: string | null;
  admin_notes: string | null; delivery_note: string | null;
  razorpay_order_id: string; razorpay_payment_id: string;
  source?: string | null;
  fulfillment_type?: string | null;
  payment_method?: string | null;
  source_note?: string | null;
  customer: { name: string; phone: string; email: string; address_line1: string; address_line2: string | null; city: string; state: string; pincode: string };
  items: OrderItem[];
}

const STATUSES = ['pending','processing','shipped','delivered','cancelled','refunded'];
const STATUS_BADGE: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700', processing:'bg-purple-100 text-purple-700',
  shipped:'bg-blue-100 text-blue-700', delivered:'bg-green-100 text-green-700',
  cancelled:'bg-red-100 text-red-600', refunded:'bg-gray-100 text-gray-500',
};
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder]             = useState<OrderDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [status, setStatus]           = useState('');
  const [tracking, setTracking]       = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`).then(r => r.json()).then(d => {
      setOrder(d); setStatus(d.status); setTracking(d.tracking_number ?? '');
      setTrackingUrl(d.tracking_url ?? ''); setNotes(d.admin_notes ?? ''); setLoading(false);
    });
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, tracking_number: tracking || null, tracking_url: trackingUrl || null, admin_notes: notes || null }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;
  if (!order) return <p className="font-mono text-ink/80 p-8">Order not found</p>;

  const hasChanges = status !== order.status || tracking !== (order.tracking_number ?? '') || trackingUrl !== (order.tracking_url ?? '') || notes !== (order.admin_notes ?? '');

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/orders" className="flex items-center gap-1.5 font-mono text-[0.72rem] text-ink/80 hover:text-ink/80">
          <ArrowLeft size={13} /> Orders
        </Link>
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <h1 className="font-bebas text-[#191714] text-3xl tracking-wide">{order.order_number}</h1>
          {order.source === 'manual' && (
            <span className="font-mono text-[0.55rem] uppercase tracking-wider px-2 py-1 rounded bg-[#191714] text-white font-bold">Manual</span>
          )}
          <span className={`font-mono text-[0.62rem] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${STATUS_BADGE[order.status]}`}>{order.status}</span>
          <span className={`font-mono text-[0.62rem] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.payment_status}</span>
          <span className="font-mono text-[0.65rem] text-ink/80">{new Date(order.created_at).toLocaleString('en-IN')}</span>
        </div>
        <button onClick={save} disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors ${saved ? 'bg-green-600 text-white' : hasChanges ? 'bg-terracotta text-white hover:bg-[#a84015]' : 'bg-[#F3F4F6] text-ink/80 cursor-not-allowed'}`}>
          {saving ? <><Loader2 size={14} className="animate-spin" />Saving</> : saved ? <><Check size={14} />Saved</> : <><Save size={14} />Save</>}
        </button>
        <button
          type="button"
          onClick={() => downloadPackingSlipPDF([orderToPackingSlip({ ...order, items: order.items })], `packing-slip-${order.order_number}.pdf`)}
          className="flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors bg-white border border-[#E5E7EB] text-ink/80 hover:border-gray-400"
        >
          <Printer size={14} />Print packing slip
        </button>
        {order.source === 'manual' && (
          <button
            type="button"
            onClick={() => downloadReceiptPDF(orderToReceipt({ ...order, items: order.items }))}
            className="flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors bg-white border border-[#E5E7EB] text-ink/80 hover:border-gray-400"
          >
            <FileDown size={14} />Download receipt
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left */}
        <div className="space-y-5">
          {/* Items */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider">Items Ordered</h2>
            </div>
            {order.items.map(item => (
              <div key={item.id} className="flex gap-4 px-5 py-4 border-b border-[#F9FAFB] last:border-0">
                {item.product?.images?.[0] && (
                  <div className="w-14 h-14 relative bg-[#F9FAFB] flex-shrink-0 rounded overflow-hidden">
                    <Image src={item.product.images[0]} alt={item.product_name} fill className="object-cover" sizes="56px" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-rajdhani font-bold text-[0.85rem] text-[#191714] uppercase">{item.product_name}</p>
                  <p className="font-mono text-[0.68rem] text-ink/80">{item.color ? item.color + ' · ' : ''}Size {item.size} · Qty {item.quantity}</p>
                </div>
                <p className="font-mono text-[0.85rem] text-[#191714]">{fmt(item.price)}</p>
              </div>
            ))}
            <div className="px-5 py-4 bg-[#FFFFFF] space-y-2">
              <div className="flex justify-between"><span className="font-mono text-[0.72rem] text-ink/80">Subtotal</span><span className="font-mono text-[0.75rem]">{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="font-mono text-[0.72rem] text-ink/80">Shipping</span><span className="font-mono text-[0.75rem]">{order.shipping === 0 ? 'FREE' : fmt(order.shipping)}</span></div>
              <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                <span className="font-rajdhani font-bold text-[0.75rem] text-[#191714] uppercase">Total</span>
                <span className="font-mono text-[0.9rem] text-terracotta font-bold">{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status + Tracking */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider">Update Order</h2>
            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-1.5 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40">
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-1.5 block">Tracking No.</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="1234567890"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.78rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80" />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-1.5 block">Tracking URL</label>
                <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.78rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-1.5 block">Internal Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Your private notes about this order..."
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.78rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80 resize-none" />
            </div>
            <div className="flex gap-2">
              {[{l:'Mark Shipped',v:'shipped'},{l:'Delivered',v:'delivered'},{l:'Cancel',v:'cancelled'}].map(a => (
                <button key={a.v} onClick={() => setStatus(a.v)}
                  className={`flex-1 py-2 rounded-lg font-mono text-[0.68rem] transition-colors ${status === a.v ? 'bg-terracotta text-white' : 'bg-[#F9FAFB] text-ink/80 hover:bg-[#EBE8E2]'}`}>
                  {a.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Customer</h2>
            <p className="font-rajdhani font-bold text-[1rem] text-[#191714] mb-0.5">{order.customer.name}</p>
            <p className="font-mono text-[0.72rem] text-ink/80 mb-4">{order.customer.email}</p>
            <a href={`https://wa.me/91${order.customer.phone}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-lg px-4 py-2.5 font-rajdhani font-bold text-[0.78rem] uppercase tracking-wider hover:bg-green-600 transition-colors w-full mb-2">
              <MessageCircle size={14} /> +91 {order.customer.phone}
            </a>
            <Link href="/admin/customers"
              className="flex items-center justify-center gap-2 bg-[#F9FAFB] text-ink/80 rounded-lg px-4 py-2.5 font-rajdhani font-bold text-[0.75rem] uppercase tracking-wider hover:bg-[#EBE8E2] transition-colors w-full">
              <ExternalLink size={13} /> Customer Profile
            </Link>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Delivery Address</h2>
            <div className="font-mono text-[0.78rem] text-[#191714] leading-[1.9]">
              <p>{order.customer.address_line1}</p>
              {order.customer.address_line2 && <p>{order.customer.address_line2}</p>}
              <p>{order.customer.city}, {order.customer.state}</p>
              <p className="text-ink/80">{order.customer.pincode}</p>
            </div>
            {order.delivery_note && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-mono text-[0.68rem] text-yellow-700">Note: {order.delivery_note}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-3">Payment</h2>
            <div className="space-y-2">
              {order.payment_method && (
                <div>
                  <p className="font-mono text-[0.6rem] text-ink/80 uppercase tracking-widest">Method</p>
                  <p className="font-mono text-[0.72rem] text-[#191714] uppercase">{order.payment_method}</p>
                </div>
              )}
              {order.fulfillment_type && (
                <div>
                  <p className="font-mono text-[0.6rem] text-ink/80 uppercase tracking-widest">Fulfillment</p>
                  <p className="font-mono text-[0.72rem] text-[#191714] capitalize">{order.fulfillment_type}</p>
                </div>
              )}
              {order.source_note && (
                <div>
                  <p className="font-mono text-[0.6rem] text-ink/80 uppercase tracking-widest">Source note</p>
                  <p className="font-mono text-[0.72rem] text-[#191714]">{order.source_note}</p>
                </div>
              )}
              {[['Razorpay Order ID', order.razorpay_order_id], ['Payment ID', order.razorpay_payment_id]].map(([l,v]) => v && (
                <div key={l as string}><p className="font-mono text-[0.6rem] text-ink/80 uppercase tracking-widest">{l}</p>
                  <p className="font-mono text-[0.72rem] text-[#191714] break-all">{v}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
