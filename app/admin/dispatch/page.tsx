'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Loader2, Printer, Save, Truck } from 'lucide-react';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { downloadPackingSlipPDF, orderToPackingSlip } from '@/lib/packing-slip-pdf';
import { AdminToast } from '@/components/admin/AdminToast';

interface DispatchOrder {
  id: string;
  order_number: string;
  tracking_number: string | null;
  created_at: string;
  customer: {
    name: string;
    phone: string;
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
    quantity: number;
  }[];
}

export default function AdminDispatchPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/dispatch', { cache: 'no-store' });
    const data = await res.json();
    const list: DispatchOrder[] = data.orders ?? [];
    setOrders(list);
    setTrackingEdits((prev) => {
      const next = { ...prev };
      for (const o of list) {
        if (!(o.id in next)) {
          next[o.id] = o.tracking_number ?? '';
        }
      }
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveAllTracking() {
    const updates = orders
      .map((o) => ({
        id: o.id,
        tracking_number: (trackingEdits[o.id] ?? '').trim(),
      }))
      .filter((u) => u.tracking_number.length > 0);

    if (updates.length === 0) {
      setToast({ message: 'Enter at least one tracking number', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/dispatch/tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `${data.saved} tracking number${data.saved !== 1 ? 's' : ''} saved`, variant: 'success' });
        await load();
      } else {
        setToast({ message: data.error ?? 'Failed to save tracking numbers', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to save tracking numbers', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function markAllShipped() {
    setShipping(true);
    try {
      const res = await fetch('/api/admin/dispatch/ship', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({
          message: `${data.shipped} order${data.shipped !== 1 ? 's' : ''} shipped · ${data.emailsSent} email${data.emailsSent !== 1 ? 's' : ''} sent`,
          variant: 'success',
        });
        await load();
      } else {
        setToast({ message: data.error ?? 'Failed to mark orders as shipped', variant: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to mark orders as shipped', variant: 'error' });
    } finally {
      setShipping(false);
    }
  }

  function printAllSlips() {
    const slips = orders.map((o) =>
      orderToPackingSlip({
        order_number: o.order_number,
        created_at: o.created_at,
        tracking_number: trackingEdits[o.id] || o.tracking_number,
        customer: o.customer,
        items: o.items,
      })
    );
    downloadPackingSlipPDF(slips, `packing-slips-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const withTracking = orders.filter(
    (o) => (trackingEdits[o.id] ?? o.tracking_number ?? '').trim().length > 0
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {toast && (
        <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Dispatch</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">
            {orders.length} order{orders.length !== 1 ? 's' : ''} ready to ship
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={printAllSlips}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase text-ink/70 hover:border-gray-400"
            >
              <Printer size={13} /> Print all slips
            </button>
          )}
          <button
            onClick={saveAllTracking}
            disabled={saving || orders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#191714] text-white rounded-lg font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase hover:bg-[#2a2520] disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save all tracking numbers
          </button>
          <button
            onClick={markAllShipped}
            disabled={shipping || withTracking === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase hover:bg-[#a84015] disabled:opacity-50"
          >
            {shipping ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
            Mark all as shipped
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <Truck size={32} className="mx-auto text-ink/20 mb-3" />
          <p className="font-bebas text-[#191714] text-2xl mb-1">Nothing to dispatch</p>
          <p className="font-mono text-ink/60 text-[0.75rem]">No orders in processing status.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                {['Order', 'Customer', 'Items', 'Speed Post Tracking', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left font-mono text-[0.6rem] uppercase tracking-widest text-ink/80"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const tracking = trackingEdits[order.id] ?? '';
                const waUrl = buildWhatsAppURL(
                  order.customer.phone,
                  order.order_number,
                  tracking || order.tracking_number
                );

                return (
                  <tr key={order.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA]">
                    <td className="px-5 py-4">
                      <span className="font-mono text-[0.78rem] font-medium text-[#191714]">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-rajdhani font-bold text-[0.85rem] text-[#191714]">
                        {order.customer.name}
                      </p>
                      <p className="font-mono text-[0.65rem] text-ink/60">+91 {order.customer.phone}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-[0.72rem] text-ink/70 max-w-[200px]">
                      {order.items
                        .map(
                          (i) =>
                            `${i.product_name} (${i.color ? i.color + ' · ' : ''}${i.size})`
                        )
                        .join(', ')}
                    </td>
                    <td className="px-5 py-4">
                      <input
                        value={tracking}
                        onChange={(e) =>
                          setTrackingEdits((prev) => ({
                            ...prev,
                            [order.id]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13),
                          }))
                        }
                        placeholder="13-char tracking no."
                        maxLength={13}
                        className="w-full max-w-[180px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono text-[0.78rem] uppercase focus:outline-none focus:border-terracotta/40 placeholder:normal-case placeholder:text-ink/40"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg font-rajdhani font-bold text-[0.72rem] uppercase tracking-wider hover:bg-green-600"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
