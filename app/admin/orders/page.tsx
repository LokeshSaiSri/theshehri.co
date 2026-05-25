'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, RefreshCw } from 'lucide-react';

interface Order {
  id: string; order_number: string; status: string; payment_status: string;
  total: number; created_at: string; tracking_number: string | null;
  customer: { name: string; phone: string; email: string; city: string };
}

const STATUS_TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-blue-100 text-blue-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  refunded:   'bg-gray-100 text-gray-500',
};

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminOrders() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [status, setStatus]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page) });
    if (search) params.set('search', search);
    const res  = await fetch(`/api/admin/orders?${params}`);
    const json = await res.json();
    setOrders(json.orders ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [status, search, page]);

  useEffect(() => { setPage(1); }, [status, search]);
  useEffect(() => { load(); }, [load]);

  const tabCounts = STATUS_TABS.reduce((acc, s) => ({ ...acc, [s]: s === 'all' ? total : undefined }), {} as Record<string, number | undefined>);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Orders</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">{total} total orders</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg font-mono text-[0.72rem] text-ink/80 hover:text-ink transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Status tabs */}
        <div className="flex overflow-x-auto border-b border-[#F3F4F6]">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-5 py-3.5 font-mono text-[0.68rem] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
                status === s
                  ? 'border-terracotta text-terracotta bg-[#FEF8F5]'
                  : 'border-transparent text-ink/80 hover:text-ink/80'
              }`}
            >
              {s}
              {s === 'all' && tabCounts[s] !== undefined && (
                <span className="ml-1.5 bg-[#F3F4F6] text-ink/80 px-1.5 py-0.5 rounded-full text-[0.6rem]">
                  {tabCounts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[#F3F4F6]">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/80" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order #, name, phone…"
              className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono text-[0.78rem] text-ink focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-[#F3F4F6]">
                {['Order', 'Customer', 'Location', 'Total', 'Payment', 'Status', 'Tracking', 'Time', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[0.6rem] uppercase tracking-widest text-ink/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F9FAFB]">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3 bg-[#F3F4F6] rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 font-mono text-ink/80 text-sm">No orders found</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} className="border-b border-[#F9FAFB] hover:bg-[#FFFFFF] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.78rem] font-medium text-[#191714]">{o.order_number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-rajdhani font-bold text-[0.82rem] text-[#191714]">{o.customer?.name}</p>
                      <a href={`https://wa.me/91${o.customer?.phone}`} target="_blank" rel="noreferrer"
                         className="font-mono text-[0.65rem] text-green-600 hover:underline">
                        +91 {o.customer?.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.72rem] text-ink/80">{o.customer?.city}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.82rem] text-[#191714] font-medium">{fmt(o.total)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block font-mono text-[0.6rem] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${
                        o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{o.payment_status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block font-mono text-[0.6rem] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${STATUS_BADGE[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {o.tracking_number
                        ? <span className="font-mono text-[0.68rem] text-blue-600">{o.tracking_number}</span>
                        : <span className="font-mono text-[0.65rem] text-ink/80">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.68rem] text-ink/80">{timeAgo(o.created_at)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`}
                        className="flex items-center gap-0.5 font-mono text-[0.68rem] text-terracotta hover:underline whitespace-nowrap">
                        Manage <ArrowRight size={10} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 25 && (
          <div className="px-5 py-4 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="font-mono text-[0.68rem] text-ink/80">
              Page {page} of {Math.ceil(total / 25)}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 font-mono text-[0.68rem] bg-white border border-[#E5E7EB] rounded disabled:opacity-40 hover:border-gray-400">
                ← Prev
              </button>
              <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 font-mono text-[0.68rem] bg-white border border-[#E5E7EB] rounded disabled:opacity-40 hover:border-gray-400">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
