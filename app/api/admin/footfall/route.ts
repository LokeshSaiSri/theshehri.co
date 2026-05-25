import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const since30  = new Date(Date.now() - 30 * 86400000).toISOString();

  // Fetch all events from the last 30 days
  const { data: events, error } = await supabase
    .from('events')
    .select('event_type, page, metadata, session_id, source, created_at')
    .gte('created_at', since30);

  if (error) {
    return NextResponse.json({ error: error.message, details: error.details, code: error.code });
  }

  const ev = events ?? [];

  // Count by event type
  const byType = (type: string) => ev.filter(e => e.event_type === type).length;
  const uniqueSessions = new Set(ev.map(e => e.session_id).filter(Boolean)).size;

  const pageViews    = byType('page_view');
  const productViews = byType('product_view');
  const addToCarts   = byType('add_to_cart');
  const checkouts    = byType('checkout_started');
  const payments     = byType('payment_initiated');
  const purchases    = byType('payment_success');

  const total = pageViews || 1;
  const funnel = [
    { name: 'Page Views',      value: pageViews,    pct: '100%',                              drop: '' },
    { name: 'Product Views',   value: productViews, pct: `${Math.round(productViews/total*100)}%`, drop: productViews < pageViews ? `${Math.round((1-productViews/total)*100)}%` : '' },
    { name: 'Add to Cart',     value: addToCarts,   pct: `${Math.round(addToCarts/total*100)}%`,  drop: addToCarts < productViews ? `${Math.round((1-addToCarts/Math.max(productViews,1))*100)}%` : '' },
    { name: 'Checkout',        value: checkouts,    pct: `${Math.round(checkouts/total*100)}%`,   drop: checkouts < addToCarts ? `${Math.round((1-checkouts/Math.max(addToCarts,1))*100)}%` : '' },
    { name: 'Payment',         value: payments,     pct: `${Math.round(payments/total*100)}%`,    drop: payments < checkouts ? `${Math.round((1-payments/Math.max(checkouts,1))*100)}%` : '' },
    { name: 'Order Placed',    value: purchases,    pct: `${Math.round(purchases/total*100)}%`,   drop: purchases < payments ? `${Math.round((1-purchases/Math.max(payments,1))*100)}%` : '' },
  ];

  // Page views breakdown
  const pageMap: Record<string, number> = {};
  ev.filter(e => e.event_type === 'page_view').forEach(e => {
    const p = e.page ?? '/';
    pageMap[p] = (pageMap[p] ?? 0) + 1;
  });
  const pageViews30 = Object.entries(pageMap).map(([page, views]) => ({ page, views })).sort((a,b) => b.views - a.views).slice(0,10);

  // Sources
  const sourceMap: Record<string, number> = {};
  ev.forEach(e => { const s = e.source ?? 'direct'; sourceMap[s] = (sourceMap[s] ?? 0) + 1; });
  const topSources = Object.entries(sourceMap).map(([source, sessions]) => ({ source, sessions })).sort((a,b) => b.sessions - a.sessions).slice(0,6);

  // Exit pages (last page before session ends) — approximate with page_view events
  const exitMap: Record<string, number> = {};
  const sessionLastPage: Record<string, string> = {};
  ev.filter(e => e.event_type === 'page_view' && e.session_id).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).forEach(e => {
    sessionLastPage[e.session_id] = e.page ?? '/';
  });
  Object.values(sessionLastPage).forEach(p => { exitMap[p] = (exitMap[p] ?? 0) + 1; });
  const exitPages = Object.entries(exitMap).map(([page, exits]) => ({ page, exits })).sort((a,b) => b.exits - a.exits).slice(0,6);

  const cartAbandonment = addToCarts > 0 ? ((addToCarts - purchases) / addToCarts) * 100 : 0;

  return NextResponse.json({ funnel, pageViews: pageViews30, exitPages, topSources, cartAbandonment, avgTimeOnSite: 'N/A', uniqueSessions });
}
