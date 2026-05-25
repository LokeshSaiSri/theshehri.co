'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react';

export default function AdminAlerts() {
  const [stats, setStats]     = useState<{stockAlerts: {id:string;size:string;available:number;sku:string;product:{name:string;slug:string}}[];recentOrders:{id:string;order_number:string;status:string;total:number;created_at:string;customer:{name:string}}[]} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;
  if (!stats) return null;

  const pendingOrders = stats.recentOrders.filter(o => o.status === 'pending');
  const allAlerts = [
    ...stats.stockAlerts.map(v => ({
      type: 'stock' as const, title: `Low Stock: ${v.product?.name} (${v.size})`,
      desc: v.available === 0 ? 'OUT OF STOCK' : `Only ${v.available} left`, urgent: v.available === 0,
      link: '/admin/products', id: v.id,
    })),
    ...pendingOrders.map(o => ({
      type: 'order' as const, title: `Pending Order: ${o.order_number}`,
      desc: `${o.customer?.name} · ₹${o.total?.toLocaleString('en-IN')}`, urgent: false,
      link: `/admin/orders/${o.id}`, id: o.id,
    })),
  ];

  return (
    <div className="space-y-6 max-w-[800px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Alerts</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">{allAlerts.length} active alert{allAlerts.length !== 1 ? 's' : ''}</p>
      </div>

      {allAlerts.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="font-bebas text-[#191714] text-2xl mb-1">All Clear</p>
          <p className="font-mono text-ink/80 text-[0.75rem]">No stock alerts or pending orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allAlerts.map(alert => (
            <Link key={alert.id} href={alert.link}
              className={`flex items-start gap-4 bg-white border rounded-xl p-5 hover:shadow-sm transition-all ${alert.urgent ? 'border-red-200' : 'border-[#E5E7EB]'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.urgent ? 'bg-red-100' : 'bg-orange-100'}`}>
                {alert.type === 'stock' ? <ShoppingBag size={15} className={alert.urgent ? 'text-red-600' : 'text-orange-500'} /> : <Package size={15} className="text-blue-600" />}
              </div>
              <div className="flex-1">
                <p className="font-rajdhani font-bold text-[0.85rem] text-[#191714] uppercase tracking-wide">{alert.title}</p>
                <p className={`font-mono text-[0.72rem] mt-0.5 ${alert.urgent ? 'text-red-600 font-bold' : 'text-ink/80'}`}>{alert.desc}</p>
              </div>
              {alert.urgent && (
                <div className="flex-shrink-0">
                  <AlertTriangle size={15} className="text-red-500" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
