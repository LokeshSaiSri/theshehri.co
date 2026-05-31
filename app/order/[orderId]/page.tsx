'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { SITE_CONTACT } from '@/lib/site-contact';
import { Check, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  delivery_note: string | null;
  created_at: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    id: string;
    product_name: string;
    size: string;
    price: number;
    quantity: number;
  }[];
}

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, shipping, total, delivery_note, created_at,
        customer:customers(name, phone, email, address_line1, address_line2, city, state, pincode),
        items:order_items(id, product_name, size, price, quantity)
      `)
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder(data as unknown as OrderDetail);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <div className="font-mono text-ink/70 text-sm animate-pulse">Loading your order…</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-ink/70">Order not found.</p>
        <Link href="/" className="font-rajdhani font-bold text-sm text-terracotta underline underline-offset-4">Back to Home</Link>
      </main>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-paper border-b border-stone z-50 flex items-center justify-between px-6 md:px-12 h-16">
        <Link href="/" className="flex flex-row items-baseline gap-1 font-bebas text-ink text-xl pt-1">
          <span className="tracking-wide text-[1.2rem]">THE</span>
          <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
          <span className="tracking-wide text-[1.2rem]">CO.</span>
        </Link>
      </div>

      <div className="pt-16 max-w-[680px] mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success mark */}
          <div className="flex flex-col items-center text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, delay: 0.2 }}
              className="w-16 h-16 bg-ink rounded-full flex items-center justify-center mb-6"
            >
              <Check size={28} className="text-paper" strokeWidth={2.5} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="font-mono text-[0.75rem] text-ink/70 uppercase tracking-widest mb-2">Order Confirmed</p>
              <h1 className="font-bebas text-ink text-5xl md:text-6xl leading-[0.9] mb-3">
                THANK YOU,<br />{order.customer.name.split(' ')[0].toUpperCase()}.
              </h1>
              <p className="font-mono text-[0.82rem] text-ink/70">
                We&apos;ve got your order. We&apos;ll WhatsApp you when it ships.
              </p>
            </motion.div>
          </div>

          {/* Order number banner */}
          <div className="bg-ink px-6 py-4 mb-8 flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.65rem] text-ink/70 uppercase tracking-widest mb-0.5">Order</p>
              <p className="font-bebas text-paper text-2xl tracking-widest">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[0.65rem] text-ink/70 uppercase tracking-widest mb-0.5">Placed on</p>
              <p className="font-mono text-[0.75rem] text-ink/70">{date}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <p className="font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.2em] text-ink/70 mb-4">Your Items</p>
            <div className="divide-y divide-stone/20">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-rajdhani font-bold text-[0.9rem] uppercase tracking-wide text-ink">{item.product_name}</p>
                    <p className="font-mono text-[0.72rem] text-ink/70 mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="font-mono text-[0.9rem] text-ink">₹{Number(item.price).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-linen px-6 py-5 mb-8 space-y-2.5">
            <div className="flex justify-between">
              <span className="font-mono text-[0.75rem] text-ink/70">Subtotal</span>
              <span className="font-mono text-[0.82rem] text-ink">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[0.75rem] text-ink/70">Shipping</span>
              <span className="font-mono text-[0.82rem] text-ink">{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
            </div>
            <div className="w-full h-px bg-stone/20" />
            <div className="flex justify-between">
              <span className="font-rajdhani font-bold text-[0.8rem] uppercase tracking-wider text-ink">Total Paid</span>
              <span className="font-mono text-[1rem] text-ink">₹{Number(order.total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="mb-10">
            <p className="font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.2em] text-ink/70 mb-3">Shipping To</p>
            <div className="font-mono text-[0.8rem] text-ink leading-[1.8]">
              <p>{order.customer.name}</p>
              <p>{order.customer.address_line1}</p>
              {order.customer.address_line2 && <p>{order.customer.address_line2}</p>}
              <p>{order.customer.city}, {order.customer.state} — {order.customer.pincode}</p>
              <p className="text-ink/70 mt-1">+91 {order.customer.phone}</p>
            </div>
            {order.delivery_note && (
              <p className="font-mono text-[0.72rem] text-ink/70 mt-3 italic">Note: {order.delivery_note}</p>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-stone/20 mb-10" />

          {/* What's next */}
          <div className="mb-10">
            <p className="font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.2em] text-ink/70 mb-5">What Happens Next</p>
            <div className="space-y-4">
              {[
                { step: '01', text: 'We pack your order within 24 hours.' },
                { step: '02', text: 'You get a WhatsApp with your tracking link when it ships.' },
                { step: '03', text: 'Delivered in 5–7 days. Delhi NCR usually faster.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <span className="font-bebas text-terracotta text-xl leading-none flex-shrink-0">{s.step}</span>
                  <p className="font-mono text-[0.8rem] text-ink/70 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Instagram CTA */}
          <div className="bg-ink p-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-1">
              <p className="font-bebas text-paper text-xl tracking-widest mb-1">TAG US WHEN IT ARRIVES</p>
              <p className="font-mono text-[0.72rem] text-ink/70">{SITE_CONTACT.instagramHandle} · we repost every single one.</p>
            </div>
            <a
              href={SITE_CONTACT.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-terracotta text-white font-rajdhani font-bold text-xs tracking-widest uppercase px-5 py-3 hover:bg-paper hover:text-terracotta transition-colors duration-300 flex-shrink-0"
            >
              <Instagram size={14} /> Instagram ↗
            </a>
          </div>

          {/* Back to shop */}
          <div className="text-center mt-10">
            <Link
              href="/shop"
              className="font-mono text-[0.75rem] text-ink/70 hover:text-ink transition-colors underline underline-offset-4 decoration-stone/40"
            >
              Browse the other style →
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
