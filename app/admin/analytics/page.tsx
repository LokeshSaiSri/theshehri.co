'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  chartData:      { date: string; revenue: number; orders: number }[];
  productBreakdown: { name: string; revenue: number; units: number }[];
  sizeBreakdown:  { size: string; units: number }[];
  cityBreakdown:  { city: string; orders: number }[];
  conversionRate: number;
  avgOrderValue:  number;
  totalRevenue:   number;
  totalOrders:    number;
}

const COLORS = ['#C04E18','#191714','#8B6F5B','#CEC8BF','#A0927C'];
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function AdminAnalytics() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState('30');

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${range}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [range]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Analytics</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">Revenue, orders & product performance</p>
        </div>
        <div className="flex gap-2">
          {[['7','7d'],['30','30d'],['90','90d']].map(([v,l]) => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-3 py-1.5 font-mono text-[0.68rem] rounded-lg border transition-colors ${range === v ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-ink/80 border-[#E5E7EB] hover:border-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: fmt(data.totalRevenue) },
          { label: 'Orders',  value: String(data.totalOrders) },
          { label: 'Avg Order', value: fmt(data.avgOrderValue) },
          { label: 'Conv. Rate', value: `${data.conversionRate.toFixed(1)}%` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-2">{kpi.label}</p>
            <p className="font-bebas text-3xl text-[#191714]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue area chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#C04E18" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#C04E18" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontFamily:'monospace', fontSize:10, fill:'#CEC8BF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily:'monospace', fontSize:10, fill:'#CEC8BF' }} axisLine={false} tickLine={false}
              tickFormatter={v => v===0 ? '0' : `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ fontFamily:'monospace', fontSize:11, border:'1px solid #E5E7EB', borderRadius:6 }}
              formatter={(v) => [fmt(Number(v ?? 0)), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#C04E18" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Orders per day */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Orders / Day</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.chartData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontFamily:'monospace', fontSize:9, fill:'#CEC8BF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily:'monospace', fontSize:9, fill:'#CEC8BF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily:'monospace', fontSize:10, border:'1px solid #E5E7EB', borderRadius:6 }} />
              <Bar dataKey="orders" fill="#191714" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Product Split</h2>
          {data.productBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-40 font-mono text-ink/80 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data.productBreakdown} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                  {data.productBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily:'monospace', fontSize:10 }} formatter={(v) => [fmt(Number(v??0)),'Revenue']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily:'monospace', fontSize:10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Size breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Size Popularity</h2>
          <div className="space-y-3 mt-2">
            {data.sizeBreakdown.map((s, i) => {
              const max = Math.max(...data.sizeBreakdown.map(x => x.units));
              const pct = max > 0 ? (s.units / max) * 100 : 0;
              return (
                <div key={s.size}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[0.72rem] text-[#191714]">{s.size}</span>
                    <span className="font-mono text-[0.68rem] text-ink/80">{s.units} sold</span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.sizeBreakdown.length === 0 && <p className="font-mono text-ink/80 text-sm text-center py-6">No data yet</p>}
          </div>
        </div>
      </div>

      {/* City breakdown */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Top Cities</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.cityBreakdown.slice(0, 10).map((c, i) => (
            <div key={c.city} className="bg-[#FFFFFF] rounded-lg p-3 text-center">
              <p className="font-mono text-[0.55rem] text-ink/80 uppercase tracking-widest mb-1">#{i+1}</p>
              <p className="font-rajdhani font-bold text-[0.85rem] text-[#191714]">{c.city}</p>
              <p className="font-mono text-[0.68rem] text-terracotta">{c.orders} orders</p>
            </div>
          ))}
          {data.cityBreakdown.length === 0 && <p className="col-span-5 font-mono text-ink/80 text-sm text-center py-8">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
