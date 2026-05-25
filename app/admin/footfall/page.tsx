'use client';

import { useEffect, useState } from 'react';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface FunnelStep { name: string; value: number; pct: string; drop: string; }
interface FootfallData {
  funnel:      FunnelStep[];
  pageViews:   { page: string; views: number }[];
  exitPages:   { page: string; exits: number }[];
  topSources:  { source: string; sessions: number }[];
  cartAbandonment: number;
  avgTimeOnSite:   string;
}

const STEP_COLORS = ['#C04E18','#A84015','#8B5E3C','#6D4A30','#4A3320'];

export default function AdminFootfall() {
  const [data, setData]       = useState<FootfallData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/footfall').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;
  if (!data)   return null;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Footfall</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">Where visitors drop off in the buying journey</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors',   value: String(data.funnel[0]?.value ?? 0) },
          { label: 'Cart Abandonment', value: `${data.cartAbandonment.toFixed(0)}%` },
          { label: 'Checkout Rate',    value: data.funnel[2] && data.funnel[0] ? `${((data.funnel[2].value / data.funnel[0].value) * 100).toFixed(1)}%` : '0%' },
          { label: 'Conversion',       value: data.funnel[4] && data.funnel[0] ? `${((data.funnel[4].value / data.funnel[0].value) * 100).toFixed(1)}%` : '0%' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-2">{k.label}</p>
            <p className="font-bebas text-3xl text-[#191714]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversion Funnel */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-6">Conversion Funnel</h2>
          <div className="space-y-3">
            {data.funnel.map((step, i) => (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] text-ink/80 w-5">{i+1}</span>
                    <span className="font-rajdhani font-bold text-[0.82rem] text-[#191714] uppercase tracking-wide">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[0.68rem] text-ink/80">{step.value.toLocaleString()}</span>
                    {step.drop && <span className="font-mono text-[0.62rem] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">↓ {step.drop}</span>}
                  </div>
                </div>
                <div className="h-7 bg-[#F9FAFB] rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: step.pct, backgroundColor: STEP_COLORS[i] ?? '#C04E18' }}
                  >
                    <span className="font-mono text-[0.58rem] text-white/80 font-bold">{step.pct}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[0.62rem] text-ink/80 mt-4 text-center">Based on tracked events from Supabase</p>
        </div>

        {/* Page Views */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Top Pages</h2>
          <div className="space-y-3">
            {data.pageViews.map((p, i) => {
              const max = Math.max(...data.pageViews.map(x => x.views));
              const pct = max > 0 ? (p.views / max) * 100 : 0;
              return (
                <div key={p.page}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[0.72rem] text-[#191714] truncate max-w-[200px]">{p.page}</span>
                    <span className="font-mono text-[0.68rem] text-ink/80">{p.views.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.pageViews.length === 0 && <p className="font-mono text-ink/80 text-sm text-center py-8">No page views tracked yet</p>}
          </div>
        </div>
      </div>

      {/* Exit pages + Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Top Exit Pages</h2>
          <div className="space-y-2">
            {data.exitPages.slice(0,6).map(e => (
              <div key={e.page} className="flex justify-between py-2 border-b border-[#F9FAFB] last:border-0">
                <span className="font-mono text-[0.72rem] text-[#191714]">{e.page}</span>
                <span className="font-mono text-[0.7rem] text-red-500">{e.exits} exits</span>
              </div>
            ))}
            {data.exitPages.length === 0 && <p className="font-mono text-ink/80 text-sm text-center py-6">No data yet</p>}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Traffic Sources</h2>
          <div className="space-y-3">
            {data.topSources.map(s => {
              const max = Math.max(...data.topSources.map(x => x.sessions));
              const pct = max > 0 ? (s.sessions / max) * 100 : 0;
              return (
                <div key={s.source}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[0.72rem] text-[#191714] capitalize">{s.source || 'Direct'}</span>
                    <span className="font-mono text-[0.68rem] text-ink/80">{s.sessions}</span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#191714] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.topSources.length === 0 && <p className="font-mono text-ink/80 text-sm text-center py-6">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
