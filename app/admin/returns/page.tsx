'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReturnOrder {
  id: string; order_number: string; created_at: string; total: number;
  customer: { name: string; phone: string };
  items: { product_name: string; size: string }[];
}

export default function AdminReturns() {
  const [orders, setOrders]   = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders?status=refunded')
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Returns</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">{orders.length} return{orders.length !== 1 ? 's' : ''} · Handled via DM</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
        <p className="font-mono text-[0.75rem] text-yellow-700">
          ⚠️ Returns are handled manually via Instagram DM. Mark an order as &quot;Refunded&quot; in the Orders page to move it here.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <p className="font-bebas text-[#191714] text-2xl mb-2">No Returns</p>
          <p className="font-mono text-ink/80 text-[0.75rem]">Orders marked as refunded will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-[#F3F4F6]">
                {['Order','Customer','Items','Total','Date',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[0.6rem] uppercase tracking-widest text-ink/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-[#F9FAFB] hover:bg-[#FFFFFF]">
                  <td className="px-5 py-3.5 font-mono text-[0.78rem] text-[#191714]">{o.order_number}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-rajdhani font-bold text-[0.82rem] text-[#191714]">{o.customer?.name}</p>
                    <a href={`https://wa.me/91${o.customer?.phone}`} target="_blank" rel="noreferrer"
                      className="font-mono text-[0.65rem] text-green-600 hover:underline">+91 {o.customer?.phone}</a>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[0.7rem] text-ink/80">
                    {(o.items ?? []).map(i => `${i.product_name} (${i.size})`).join(', ')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[0.82rem] text-[#191714]">₹{o.total?.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 font-mono text-[0.68rem] text-ink/80">
                    {new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-[0.68rem] text-terracotta hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
