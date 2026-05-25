import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const days     = parseInt(new URL(req.url).searchParams.get('days') ?? '30');
  const since    = new Date(Date.now() - days * 86400000).toISOString();

  const [{ data: orders }, { data: items }, { data: customers }] = await Promise.all([
    supabase.from('orders').select('id, total, created_at, customer_id, payment_status').eq('payment_status','paid').gte('created_at', since),
    supabase.from('order_items').select('product_id, product_name, size, price, quantity, order:orders(created_at, payment_status)').gte('created_at', since),
    supabase.from('customers').select('id, city, created_at').gte('created_at', since),
  ]);

  const paidOrders = orders ?? [];
  const paidItems  = (items ?? []).filter(i => (i.order as unknown as { payment_status: string })?.payment_status === 'paid');

  // Chart data
  const chartData = Array.from({ length: days > 30 ? 12 : days }, (_, idx) => {
    const step   = days > 30 ? Math.floor(days / 12) : 1;
    const day    = new Date(Date.now() - (days - idx * step) * 86400000);
    const nextDay = new Date(day.getTime() + step * 86400000);
    const dayOrders = paidOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= day && d < nextDay;
    });
    return {
      date:    day.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
      revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
      orders:  dayOrders.length,
    };
  });

  // Product breakdown
  const productMap: Record<string, { name: string; revenue: number; units: number }> = {};
  paidItems.forEach(i => {
    const key = i.product_id ?? i.product_name;
    if (!productMap[key]) productMap[key] = { name: i.product_name, revenue: 0, units: 0 };
    productMap[key].revenue += Number(i.price) * i.quantity;
    productMap[key].units   += i.quantity;
  });
  const productBreakdown = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  // Size breakdown
  const sizeMap: Record<string, number> = {};
  paidItems.forEach(i => { sizeMap[i.size] = (sizeMap[i.size] ?? 0) + i.quantity; });
  const sizeBreakdown = Object.entries(sizeMap)
    .map(([size, units]) => ({ size, units }))
    .sort((a, b) => b.units - a.units);

  // City breakdown
  const cityMap: Record<string, number> = {};
  (customers ?? []).forEach(c => { if (c.city) cityMap[c.city] = (cityMap[c.city] ?? 0) + 1; });
  const cityBreakdown = Object.entries(cityMap)
    .map(([city, orders]) => ({ city, orders }))
    .sort((a, b) => b.orders - a.orders);

  const totalRevenue  = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders   = paidOrders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Rough conversion rate: paid orders / total orders
  const { count: allOrdersCount } = await supabase.from('orders').select('*', { count:'exact', head:true }).gte('created_at', since);
  const conversionRate = allOrdersCount && allOrdersCount > 0 ? (totalOrders / allOrdersCount) * 100 : 0;

  return NextResponse.json({ chartData, productBreakdown, sizeBreakdown, cityBreakdown, conversionRate, avgOrderValue, totalRevenue, totalOrders });
}
