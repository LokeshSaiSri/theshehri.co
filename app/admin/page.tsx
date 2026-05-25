'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Users, AlertTriangle,
  ArrowRight, RefreshCw, Package,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  today:      { orders: number; revenue: number };
  allTime:    { orders: number; revenue: number };
  customers:  number;
  stockAlerts: { id: string; size: string; available: number; sku: string; product: { name: string; slug: string } }[];
  recentOrders: {
    id: string; order_number: string; status: string;
    payment_status: string; total: number; created_at: string;
    customer: { name: string; phone: string };
  }[];
  chartData: { date: string; revenue: number; orders: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  paid:       'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  refunded:   'bg-gray-100 text-gray-600',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border flex flex-col gap-3 ${accent ? 'bg-terracotta border-terracotta text-white' : 'bg-white border-[#E5E7EB]'}`}>
      <div className="flex items-start justify-between">
        <p className={`font-mono text-[0.65rem] uppercase tracking-widest ${accent ? 'text-white/70' : 'text-ink/80'}`}>{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-white/10' : 'bg-[#F9FAFB]'}`}>
          <Icon size={15} className={accent ? 'text-white' : 'text-terracotta'} />
        </div>
      </div>
      <div>
        <p className={`font-bebas text-3xl leading-none ${accent ? 'text-white' : 'text-[#191714]'}`}>{value}</p>
        {sub && <p className={`font-mono text-[0.68rem] mt-1 ${accent ? 'text-white/60' : 'text-ink/80'}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const avgOrderValue = stats.allTime.orders > 0
    ? Math.round(stats.allTime.revenue / stats.allTime.orders)
    : 0;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide leading-none">Dashboard</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-1">{today}</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg font-mono text-[0.72rem] text-ink/80 hover:text-ink hover:border-gray-400 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={fmt(stats.today.revenue)}
          sub={`${stats.today.orders} order${stats.today.orders !== 1 ? 's' : ''} today`}
          icon={TrendingUp}
          accent
        />
        <KpiCard
          label="Total Revenue"
          value={fmt(stats.allTime.revenue)}
          sub={`${stats.allTime.orders} orders all-time`}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Customers"
          value={String(stats.customers)}
          sub="Unique buyers"
          icon={Users}
        />
        <KpiCard
          label="Avg Order Value"
          value={fmt(avgOrderValue)}
          sub="All-time average"
          icon={Package}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Revenue Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-rajdhani font-bold text-[#191714] text-base uppercase tracking-wider">Revenue</h2>
              <p className="font-mono text-ink/80 text-[0.65rem]">Last 7 days</p>
            </div>
            <div className="font-bebas text-2xl text-terracotta">
              {fmt(stats.chartData.reduce((s, d) => s + d.revenue, 0))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#CEC8BF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#CEC8BF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v === 0 ? '0' : `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ fontFamily: 'monospace', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }}
                formatter={(v) => [fmt(Number(v ?? 0)), 'Revenue']}
                cursor={{ fill: '#F9FAFB' }}
              />
              <Bar dataKey="revenue" fill="#C04E18" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={15} className="text-terracotta" />
            <h2 className="font-rajdhani font-bold text-[#191714] text-base uppercase tracking-wider">Stock Alerts</h2>
            {stats.stockAlerts.length > 0 && (
              <span className="ml-auto bg-terracotta text-white font-mono text-[0.6rem] px-2 py-0.5 rounded-full">
                {stats.stockAlerts.length}
              </span>
            )}
          </div>

          {stats.stockAlerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-mono text-ink/80 text-[0.75rem]">All sizes well-stocked ✓</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.stockAlerts.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <div>
                    <p className="font-rajdhani font-bold text-[0.8rem] text-[#191714] uppercase tracking-wide">
                      {v.product?.name}
                    </p>
                    <p className="font-mono text-[0.65rem] text-ink/80">{v.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block font-mono text-[0.7rem] font-bold px-2 py-1 rounded ${
                      v.available === 0 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {v.available === 0 ? 'OUT' : `${v.available} left`}
                    </span>
                    <p className="font-mono text-[0.62rem] text-ink/80 mt-0.5">Size {v.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/admin/products"
            className="flex items-center justify-center gap-1.5 mt-4 font-mono text-[0.68rem] text-terracotta hover:underline"
          >
            Manage stock <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
          <div>
            <h2 className="font-rajdhani font-bold text-[#191714] text-base uppercase tracking-wider">Recent Orders</h2>
            <p className="font-mono text-ink/80 text-[0.65rem]">Last 10 orders</p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 font-mono text-[0.68rem] text-terracotta hover:underline"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6] bg-[#FFFFFF]">
                {['Order', 'Customer', 'Total', 'Status', 'Time', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-[0.62rem] uppercase tracking-widest text-ink/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 font-mono text-ink/80 text-sm">
                    No orders yet
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-[#F9FAFB] hover:bg-[#FFFFFF] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.78rem] text-[#191714] font-medium">{order.order_number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-rajdhani font-bold text-[0.82rem] text-[#191714]">{order.customer?.name}</p>
                      <p className="font-mono text-[0.65rem] text-ink/80">+91 {order.customer?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.82rem] text-[#191714]">{fmt(order.total)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block font-mono text-[0.62rem] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[0.72rem] text-ink/80">{timeAgo(order.created_at)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[0.68rem] text-terracotta hover:underline flex items-center gap-0.5 whitespace-nowrap"
                      >
                        View <ArrowRight size={10} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
