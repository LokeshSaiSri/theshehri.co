'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ExternalLink, Package } from 'lucide-react';
import { SITE_CONTACT } from '@/lib/site-contact';
import { StoreNav } from '@/components/StoreNav';

const STEPS = ['Ordered', 'Processing', 'Shipped', 'Delivered'] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
  refunded: -1,
};

interface TrackOrder {
  order_number: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
  items: { product_name: string; size: string; color: string | null; quantity: number }[];
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') ?? '';

  const [orderInput, setOrderInput] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      trackOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function trackOrder(e?: React.FormEvent) {
    e?.preventDefault();
    const num = orderInput.trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    setNotFound(false);
    setOrder(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(num)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? STATUS_INDEX[order.status] ?? 0 : 0;
  const isCancelled = order?.status === 'cancelled' || order?.status === 'refunded';
  const showTracking = order && (order.status === 'shipped' || order.status === 'delivered') && order.tracking_number;

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      <StoreNav />

      <div className="safe-nav-offset max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24">
        <div className="mb-10">
          <h1 className="font-bebas text-ink text-5xl md:text-6xl leading-[0.9] mb-3">Track your order</h1>
          <p className="font-mono text-[0.75rem] text-ink/60">
            Enter your order number (e.g. SHR-001)
          </p>
        </div>

        <form onSubmit={trackOrder} className="flex flex-col sm:flex-row gap-2 mb-10">
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value.toUpperCase())}
            placeholder="SHR-001"
            autoComplete="off"
            inputMode="text"
            className="flex-1 bg-white border-2 border-ink/10 px-4 py-3.5 min-h-[52px] font-mono text-sm text-ink focus:outline-none focus:border-terracotta placeholder:text-ink/30"
          />
          <button
            type="submit"
            disabled={loading || !orderInput.trim()}
            className="bg-terracotta text-paper font-rajdhani font-bold text-sm tracking-[0.15em] uppercase px-6 py-3.5 min-h-[52px] hover:bg-ink transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? '…' : 'Track order'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {notFound && searched && (
          <div className="border-2 border-ink/10 bg-white p-6">
            <p className="font-mono text-[0.82rem] text-ink/80 leading-relaxed">
              We couldn&apos;t find this order. Check the number and try again. If you need help, DM us{' '}
              <a
                href={SITE_CONTACT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:underline"
              >
                {SITE_CONTACT.instagramHandle}
              </a>{' '}
              on Instagram.
            </p>
          </div>
        )}

        {order && isCancelled && (
          <div className="border-2 border-red-200 bg-red-50 p-6">
            <p className="font-mono text-[0.82rem] text-red-700 leading-relaxed">
              This order was cancelled. If you think this is wrong, DM us{' '}
              <a
                href={SITE_CONTACT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:underline"
              >
                {SITE_CONTACT.instagramHandle}
              </a>{' '}
              on Instagram.
            </p>
          </div>
        )}

        {order && !isCancelled && (
          <div className="border-2 border-ink/10 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-ink/5 bg-ink text-paper">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-widest text-paper/50 mb-1">Order</p>
                  <p className="font-bebas text-2xl tracking-widest">{order.order_number}</p>
                </div>
                <Package size={20} className="text-terracotta" />
              </div>
              <p className="font-mono text-[0.68rem] text-paper/60 mt-2">
                Placed{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="px-6 py-5 border-b border-ink/5">
              <p className="font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.2em] text-ink/50 mb-3">
                Items
              </p>
              {order.items.map((item, i) => (
                <div key={i} className="py-2 border-b border-ink/5 last:border-0">
                  <p className="font-rajdhani font-bold text-sm uppercase text-ink">{item.product_name}</p>
                  <p className="font-mono text-[0.72rem] text-ink/60">
                    {item.color ? `${item.color} · ` : ''}Size {item.size}
                    {item.quantity > 1 ? ` · Qty ${item.quantity}` : ''}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-6">
              <p className="font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.2em] text-ink/50 mb-5">
                Status
              </p>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-ink/10 mx-4" />
                {STEPS.map((step, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center relative z-10 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-mono font-bold border-2 ${
                          done
                            ? 'bg-terracotta border-terracotta text-paper'
                            : active
                              ? 'bg-ink border-ink text-paper'
                              : 'bg-paper border-ink/20 text-ink/30'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <span
                        className={`font-mono text-[0.58rem] uppercase tracking-wider mt-2 text-center ${
                          active ? 'text-ink font-bold' : done ? 'text-terracotta' : 'text-ink/30'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {showTracking && (
              <div className="px-6 py-5 bg-linen border-t border-ink/5">
                <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-2">
                  Tracking number
                </p>
                <p className="font-mono text-sm text-ink font-bold mb-4">{order.tracking_number}</p>
                <a
                  href={`https://www.indiapost.gov.in/Track/Tnt/TrackConsignment.aspx?ConsignmentNo=${encodeURIComponent(order.tracking_number!)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-ink text-paper font-rajdhani font-bold text-xs tracking-widest uppercase px-5 py-3 hover:bg-terracotta transition-colors"
                >
                  Track on India Post <ExternalLink size={12} />
                </a>
              </div>
            )}

            {(order.status === 'shipped' || order.status === 'processing') && (
              <div className="px-6 py-4 border-t border-ink/5">
                <p className="font-mono text-[0.72rem] text-ink/60">
                  Estimated delivery: <span className="text-ink">2–4 business days from dispatch</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
