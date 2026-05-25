'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingBag, Search, ArrowLeft, X, Lock, CreditCard, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { track } from '@/lib/track';
import { useRouter } from 'next/navigation';
import NavSearch from '@/components/NavSearch';

// ─── NavBar ────────────────────────────────────────────────────────────────

function NavBar() {
  const { itemCount } = useCart();
  return (
    <nav className="fixed top-0 left-0 w-full bg-paper border-b border-stone z-50 flex items-center justify-between px-6 md:px-12 h-16">
      <Link href="/" className="flex flex-row items-baseline gap-1 font-bebas text-ink text-xl pt-1">
        <span className="tracking-wide text-[1.2rem]">THE</span>
        <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
        <span className="tracking-wide text-[1.2rem]">CO.</span>
      </Link>
      <div className="flex items-center gap-6 text-ink">
        <NavSearch />
        <Link href="/cart" className="flex items-center gap-1.5 hover:text-terracotta transition-colors">
          <ShoppingBag size={18} strokeWidth={1.5} />
          <span className="font-rajdhani text-xs font-semibold">({itemCount})</span>
        </Link>
      </div>
    </nav>
  );
}

// ─── Validation Schema ──────────────────────────────────────────────────────

const checkoutSchema = z.object({
  name:          z.string().min(2, 'Full name is required'),
  phone:         z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email:         z.string().email('Enter a valid email address'),
  address_line1: z.string().min(5, 'Street address is required'),
  address_line2: z.string().optional(),
  city:          z.string().min(2, 'City is required'),
  state:         z.string().min(2, 'State is required'),
  pincode:       z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  delivery_note: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ─── Mock Razorpay Modal ────────────────────────────────────────────────────

type PaymentMethod = 'upi' | 'card';
type PaymentState  = 'idle' | 'processing' | 'success' | 'failed';

function MockPaymentModal({
  total,
  onSuccess,
  onClose,
}: {
  total: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [method, setMethod]   = useState<PaymentMethod>('upi');
  const [state, setState]     = useState<PaymentState>('idle');
  const [upi, setUpi]         = useState('');
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry]   = useState('');
  const [cvv, setCvv]         = useState('');

  function handlePay() {
    setState('processing');
    // Simulate network + bank processing
    setTimeout(() => {
      setState('success');
      setTimeout(onSuccess, 1200);
    }, 2200);
  }

  const canPay =
    state === 'idle' &&
    (method === 'upi'
      ? upi.includes('@')
      : cardNum.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white w-full max-w-sm rounded-lg overflow-hidden shadow-2xl"
      >
        {/* Razorpay-style header */}
        <div className="bg-[#072654] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-[0.65rem] opacity-70 uppercase tracking-wider mb-0.5">The Shehri Co.</p>
            <p className="text-white font-bold text-lg">₹{total.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-yellow-400 text-[#072654] text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Test Mode
            </span>
            <button onClick={onClose} disabled={state === 'processing'} className="text-white/60 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Success screen */}
        {state === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle2 size={56} className="text-green-500 mb-4" />
            </motion.div>
            <p className="font-semibold text-gray-800 text-lg">Payment Successful!</p>
            <p className="text-gray-500 text-sm mt-1">Confirming your order…</p>
          </div>
        ) : (
          <div className="p-5">
            {/* Method tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-md p-1 mb-5">
              {[
                { id: 'upi',  label: 'UPI',  icon: <Smartphone size={14} /> },
                { id: 'card', label: 'Card', icon: <CreditCard size={14} /> },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as PaymentMethod)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition-all duration-200 ${
                    method === m.id ? 'bg-white shadow text-[#072654]' : 'text-gray-500'
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* UPI */}
            {method === 'upi' && (
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">UPI ID</label>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#072654]"
                />
                <p className="text-[0.65rem] text-gray-400 mt-1.5">Test: use any@upi</p>
              </div>
            )}

            {/* Card */}
            {method === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Card Number</label>
                  <input
                    value={cardNum}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setCardNum(v.replace(/(.{4})/g, '$1 ').trim());
                    }}
                    placeholder="4111 1111 1111 1111"
                    className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#072654]"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 font-medium mb-1">Expiry</label>
                    <input
                      value={expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        setExpiry(v);
                      }}
                      placeholder="MM/YY"
                      className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#072654]"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 font-medium mb-1">CVV</label>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      type="password"
                      className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#072654]"
                    />
                  </div>
                </div>
                <p className="text-[0.65rem] text-gray-400">Test: 4111 1111 1111 1111 · 12/29 · 123</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!canPay}
              className={`w-full mt-5 py-3 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                canPay ? 'bg-[#072654] text-white hover:bg-[#0a3575]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {state === 'processing' ? (
                <><Loader2 size={16} className="animate-spin" /> Processing…</>
              ) : (
                <><Lock size={14} /> Pay ₹{total.toLocaleString('en-IN')}</>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Lock size={10} className="text-gray-400" />
              <span className="text-[0.6rem] text-gray-400">Secured by Razorpay · SSL Encrypted</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Field component ────────────────────────────────────────────────────────

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-rajdhani font-bold text-[0.7rem] uppercase tracking-[0.15em] text-ink mb-2">
        {label}
      </label>
      {children}
      {error && <p className="font-mono text-[0.68rem] text-terracotta mt-1.5">{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border border-stone bg-paper px-4 py-3 font-mono text-[0.82rem] text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink/70 ${className}`}
      {...props}
    />
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  useEffect(() => {
    if (itemCount === 0) router.replace('/shop');
    track('page_view', { page: '/checkout' });
    track('checkout_started', { metadata: { items: itemCount, total } });
  }, [itemCount, router, total]);

  async function onFormSubmit(data: CheckoutForm) {
    setSubmitting(true);
    setFormData(data);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: data, items, subtotal, shipping, total }),
      });
      const json = await res.json();
      if (json.orderId) {
        setPendingOrderId(json.orderId);
        track('payment_initiated', { metadata: { total } });
        setShowPayment(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentSuccess() {
    if (!pendingOrderId) return;
    setShowPayment(false);
    try {
      await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: pendingOrderId }),
      });
      track('payment_success', { metadata: { order_id: pendingOrderId, total } });
      clearCart();
      router.push(`/order/${pendingOrderId}`);
    } catch (err) {
      console.error(err);
    }
  }

  if (itemCount === 0) return null;

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      <NavBar />

      <AnimatePresence>
        {showPayment && (
          <MockPaymentModal
            total={total}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPayment(false)}
          />
        )}
      </AnimatePresence>

      <div className="pt-16 max-w-[1200px] mx-auto px-6 md:px-12 py-12">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 font-mono text-[0.72rem] text-ink/70 hover:text-ink transition-colors mb-8 uppercase tracking-widest"
        >
          <ArrowLeft size={12} /> Back to Bag
        </Link>

        <h1 className="font-bebas text-ink text-5xl md:text-7xl leading-[0.85] mb-12 pt-2">
          CHECKOUT
        </h1>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">

            {/* ── LEFT: Form ──────────────────────────────────── */}
            <div className="space-y-8">

              {/* Contact */}
              <div>
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">CONTACT</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.name?.message}>
                    <Input {...register('name')} placeholder="Rahul Singh" />
                  </Field>
                  <Field label="Mobile Number" error={errors.phone?.message}>
                    <Input {...register('phone')} placeholder="9810XXXXXX" type="tel" maxLength={10} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Email Address" error={errors.email?.message}>
                    <Input {...register('email')} placeholder="rahul@gmail.com" type="email" />
                  </Field>
                </div>
              </div>

              <div className="w-full h-px bg-stone/20" />

              {/* Delivery Address */}
              <div>
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">DELIVERY ADDRESS</h2>
                <div className="space-y-4">
                  <Field label="Street Address" error={errors.address_line1?.message}>
                    <Input {...register('address_line1')} placeholder="Flat no., Building, Street" />
                  </Field>
                  <Field label="Apartment / Area (Optional)" error={errors.address_line2?.message}>
                    <Input {...register('address_line2')} placeholder="Colony, Sector, Locality" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" error={errors.city?.message}>
                      <Input {...register('city')} placeholder="New Delhi" />
                    </Field>
                    <Field label="State" error={errors.state?.message}>
                      <Input {...register('state')} placeholder="Delhi" />
                    </Field>
                  </div>
                  <Field label="PIN Code" error={errors.pincode?.message}>
                    <Input {...register('pincode')} placeholder="110001" maxLength={6} className="max-w-[180px]" />
                  </Field>
                  <Field label="Delivery Note (Optional)" error={errors.delivery_note?.message}>
                    <Input {...register('delivery_note')} placeholder="Leave at door, call before delivery, etc." />
                  </Field>
                </div>
              </div>

              <div className="w-full h-px bg-stone/20" />

              {/* Shipping info */}
              <div className="bg-linen p-5 space-y-2">
                <p className="font-mono text-[0.75rem] text-ink/70">🚚 Ships within 5–7 days from Delhi NCR</p>
                <p className="font-mono text-[0.75rem] text-ink/70">📦 {shipping === 0 ? 'FREE shipping on this order' : `₹${shipping} flat shipping`}</p>
                <p className="font-mono text-[0.75rem] text-ink/70">↩️ Returns via DM on Instagram only</p>
              </div>
            </div>

            {/* ── RIGHT: Order Summary ────────────────────────── */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-linen p-7">
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">ORDER SUMMARY</h2>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color || ''}`} className="flex gap-3">
                      <div className="w-14 h-16 relative bg-linen flex-shrink-0">
                        {item.image && <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />}
                        <span className="absolute -top-2 -right-2 bg-stone text-paper font-mono text-[0.6rem] w-5 h-5 flex items-center justify-center rounded-full">
                          1
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-rajdhani font-bold text-[0.8rem] text-ink uppercase tracking-wider">{item.productName}</p>
                        <p className="font-mono text-[0.7rem] text-ink/70">{item.color ? `${item.color} · ` : ''}Size {item.size}</p>
                      </div>
                      <p className="font-mono text-[0.85rem] text-ink">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>

                <div className="w-full h-px bg-stone/30 mb-4" />

                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between">
                    <span className="font-mono text-[0.78rem] text-ink/70">Subtotal</span>
                    <span className="font-mono text-[0.85rem] text-ink">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[0.78rem] text-ink/70">Shipping</span>
                    <span className="font-mono text-[0.85rem] text-ink">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  <div className="w-full h-px bg-stone/30 my-1" />
                  <div className="flex justify-between">
                    <span className="font-rajdhani font-bold text-[0.85rem] uppercase tracking-wider text-ink">Total</span>
                    <span className="font-mono text-[1.1rem] text-ink">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.15em] uppercase py-4 flex items-center justify-center gap-2 hover:bg-ink transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating Order…</>
                  ) : (
                    <><Lock size={14} /> PROCEED TO PAYMENT</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <Lock size={10} className="text-ink/70" />
                  <span className="font-mono text-[0.62rem] text-ink/70">Secured by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
