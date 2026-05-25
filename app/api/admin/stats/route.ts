import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: allPaidOrders },
    { data: todayOrders },
    { count: customerCount },
    { data: lowStockVariants },
    { data: recentOrders },
    { data: last30DaysOrders },
  ] = await Promise.all([
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', todayStart.toISOString()),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('product_variants').select('id, size, stock, reserved, sku, product:products(name, slug)'),
    supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, created_at, customer:customers(name, phone)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Chart: last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = (last30DaysOrders || []).filter(o => {
      const d = new Date(o.created_at);
      return d >= day && d < nextDay;
    });

    return {
      date:    day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
      orders:  dayOrders.length,
    };
  });

  // Stock alerts: available stock <= 3
  const stockAlerts = (lowStockVariants || [])
    .map(v => ({ ...v, available: Math.max(0, v.stock - v.reserved) }))
    .filter(v => v.available <= 3)
    .sort((a, b) => a.available - b.available);

  return NextResponse.json({
    today: {
      orders:  todayOrders?.length  ?? 0,
      revenue: todayOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    },
    allTime: {
      orders:  allPaidOrders?.length  ?? 0,
      revenue: allPaidOrders?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    },
    customers:    customerCount ?? 0,
    stockAlerts,
    recentOrders: recentOrders ?? [],
    chartData,
  });
}
