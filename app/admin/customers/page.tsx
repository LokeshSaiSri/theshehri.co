'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Crown, RotateCcw, Star, UserPlus, MessageCircle } from 'lucide-react';

interface Customer {
  id: string; name: string; phone: string; email: string; city: string; state: string;
  created_at: string; totalSpent: number; orderCount: number; lastOrder: string | null; tag: string;
}

const SEGMENTS = ['all','vip','repeat','new','at-risk'];
const TAG_STYLE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  vip:      { label: 'VIP',     className: 'bg-yellow-100 text-yellow-700', icon: Crown },
  repeat:   { label: 'Repeat',  className: 'bg-blue-100 text-blue-700',    icon: Star },
  new:      { label: 'New',     className: 'bg-green-100 text-green-700',  icon: UserPlus },
  'at-risk':{ label: 'At Risk', className: 'bg-red-100 text-red-600',      icon: RotateCcw },
};
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [segment, setSegment]     = useState('all');
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ segment });
    if (search) params.set('search', search);
    const data = await fetch(`/api/admin/customers?${params}`).then(r => r.json());
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [segment, search]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgLTV       = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Customers</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">{customers.length} customers · Avg LTV {fmt(avgLTV)}</p>
        </div>
      </div>

      {/* Segment KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['vip','repeat','new','at-risk'] as const).map(seg => {
          const count = customers.filter(c => c.tag === seg).length;
          const tag   = TAG_STYLE[seg];
          const Icon  = tag.icon;
          return (
            <button key={seg} onClick={() => setSegment(seg === segment ? 'all' : seg)}
              className={`bg-white border rounded-xl p-4 text-left transition-all ${segment === seg ? 'border-terracotta shadow-sm' : 'border-[#E5E7EB] hover:border-gray-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className="text-ink/80" />
                <span className={`font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${tag.className}`}>{tag.label}</span>
              </div>
              <p className="font-bebas text-2xl text-[#191714]">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center gap-0 border-b border-[#F3F4F6]">
          {SEGMENTS.map(s => (
            <button key={s} onClick={() => setSegment(s)}
              className={`px-5 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${segment === s ? 'border-terracotta text-terracotta' : 'border-transparent text-ink/80 hover:text-ink/80'}`}>
              {s}
            </button>
          ))}
          <div className="flex-1 px-4 py-2 flex justify-end">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/80" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="pl-8 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono text-[0.75rem] focus:outline-none focus:border-terracotta/40 w-52 placeholder:text-ink/80" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFFFFF] border-b border-[#F3F4F6]">
                {['Customer','Contact','Location','Orders','Total Spent','Avg Order','Last Order','Tag'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[0.6rem] uppercase tracking-widest text-ink/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b border-[#F9FAFB]">
                    {Array.from({length:8}).map((_,j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-3 bg-[#F3F4F6] rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 font-mono text-ink/80 text-sm">No customers found</td></tr>
              ) : (
                customers.map(c => {
                  const tag  = TAG_STYLE[c.tag];
                  const Icon = tag?.icon ?? UserPlus;
                  const avg  = c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0;
                  return (
                    <tr key={c.id} className="border-b border-[#F9FAFB] hover:bg-[#FFFFFF] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-rajdhani font-bold text-[0.85rem] text-[#191714]">{c.name}</p>
                        <p className="font-mono text-[0.62rem] text-ink/80">{c.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <a href={`https://wa.me/91${c.phone}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 font-mono text-[0.72rem] text-green-600 hover:underline">
                          <MessageCircle size={11} /> +91 {c.phone}
                        </a>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[0.72rem] text-ink/80">{c.city}, {c.state}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[0.82rem] text-[#191714] font-medium">{c.orderCount}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[0.82rem] text-[#191714] font-medium">{fmt(c.totalSpent)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[0.78rem] text-ink/80">{avg > 0 ? fmt(avg) : '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[0.72rem] text-ink/80">{c.lastOrder ? timeAgo(c.lastOrder) : '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {tag && (
                          <span className={`inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${tag.className}`}>
                            <Icon size={10} />{tag.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
