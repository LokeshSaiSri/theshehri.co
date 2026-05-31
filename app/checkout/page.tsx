'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { loadRazorpayScript } from '@/lib/load-razorpay';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { track } from '@/lib/track';
import { useRouter } from 'next/navigation';
import { StoreNav } from '@/components/StoreNav';
import { MobileStickyBar } from '@/components/MobileStickyBar';

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
      className={`w-full border border-stone bg-paper px-4 py-3 min-h-[48px] font-mono text-[0.82rem] text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink/70 ${className}`}
      {...props}
    />
  );
}

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const launchRazorpay = useCallback(
    async (orderId: string, orderNumber: string, customer: CheckoutForm) => {
      setPaying(true);
      setCheckoutError(null);

      let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        try {
          const configRes = await fetch('/api/razorpay/config');
          const configJson = await configRes.json();
          if (configRes.ok && configJson.keyId) {
            keyId = configJson.keyId;
          }
        } catch {
          // fall through to error below
        }
      }

      if (!keyId) {
        setCheckoutError('Payment is not configured. Contact support.');
        setPaying(false);
        return;
      }

      try {
        await loadRazorpayScript();
      } catch {
        setCheckoutError('Payment gateway failed to load. Refresh and try again.');
        setPaying(false);
        return;
      }

      try {
        const createRes = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const createJson = await createRes.json();

        if (!createRes.ok) {
          setCheckoutError(createJson.error || 'Could not start payment. Try again.');
          setPaying(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: keyId,
          amount: createJson.amount,
          currency: createJson.currency,
          name: 'The Shehri Co.',
          description: `Order ${orderNumber}`,
          order_id: createJson.order_id,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
          theme: { color: '#C04E18' },
          modal: {
            ondismiss: () => {
              setPaying(false);
              setCheckoutError('Payment cancelled. Your order is saved — try again when ready.');
            },
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyJson = await verifyRes.json();

              if (!verifyRes.ok) {
                setCheckoutError(
                  verifyJson.error || 'Payment received but verification failed. Contact support.'
                );
                return;
              }

              track('payment_success', { metadata: { order_id: orderId, total } });
              clearCart();
              router.push(`/order/${orderId}`);
            } catch (err) {
              console.error(err);
              setCheckoutError('Payment verification failed. Contact support with your order number.');
            } finally {
              setPaying(false);
            }
          },
        });

        rzp.on('payment.failed', (response) => {
          setPaying(false);
          setCheckoutError(
            response.error.description || 'Payment failed. Try again or use another method.'
          );
        });

        track('payment_initiated', { metadata: { total, order_id: orderId } });
        rzp.open();
      } catch (err) {
        console.error(err);
        setCheckoutError('Could not open payment. Check your connection and try again.');
        setPaying(false);
      }
    },
    [clearCart, router, total]
  );

  async function onFormSubmit(data: CheckoutForm) {
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: data, items, subtotal, shipping, total }),
      });
      const json = await res.json();

      if (!res.ok) {
        setCheckoutError(json.error || 'Could not place order. Try again.');
        return;
      }

      if (json.orderId) {
        await launchRazorpay(json.orderId, json.orderNumber, data);
      }
    } catch (err) {
      console.error(err);
      setCheckoutError('Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (itemCount === 0) return null;

  const busy = submitting || paying;

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <StoreNav />

      <div className="safe-nav-offset max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12 mobile-sticky-offset">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 font-mono text-[0.72rem] text-ink/70 hover:text-ink transition-colors mb-8 uppercase tracking-widest"
        >
          <ArrowLeft size={12} /> Back to Bag
        </Link>

        <h1 className="font-bebas text-ink text-5xl md:text-7xl leading-[0.85] mb-12 pt-2">
          CHECKOUT
        </h1>

        <form id="checkout-form" onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">

            <div className="space-y-8">
              <div>
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">CONTACT</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.name?.message}>
                    <Input {...register('name')} placeholder="Rahul Singh" autoComplete="name" />
                  </Field>
                  <Field label="Mobile Number" error={errors.phone?.message}>
                    <Input
                      {...register('phone')}
                      placeholder="9810XXXXXX"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Email Address" error={errors.email?.message}>
                    <Input {...register('email')} placeholder="rahul@gmail.com" type="email" autoComplete="email" />
                  </Field>
                </div>
              </div>

              <div className="w-full h-px bg-stone/20" />

              <div>
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">DELIVERY ADDRESS</h2>
                <div className="space-y-4">
                  <Field label="Street Address" error={errors.address_line1?.message}>
                    <Input {...register('address_line1')} placeholder="Flat no., Building, Street" autoComplete="address-line1" />
                  </Field>
                  <Field label="Apartment / Area (Optional)" error={errors.address_line2?.message}>
                    <Input {...register('address_line2')} placeholder="Colony, Sector, Locality" autoComplete="address-line2" />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City" error={errors.city?.message}>
                      <Input {...register('city')} placeholder="New Delhi" autoComplete="address-level2" />
                    </Field>
                    <Field label="State" error={errors.state?.message}>
                      <Input {...register('state')} placeholder="Delhi" autoComplete="address-level1" />
                    </Field>
                  </div>
                  <Field label="PIN Code" error={errors.pincode?.message}>
                    <Input
                      {...register('pincode')}
                      placeholder="110001"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      className="sm:max-w-[180px]"
                    />
                  </Field>
                  <Field label="Delivery Note (Optional)" error={errors.delivery_note?.message}>
                    <Input {...register('delivery_note')} placeholder="Leave at door, call before delivery, etc." />
                  </Field>
                </div>
              </div>

              <div className="w-full h-px bg-stone/20" />

              <div className="bg-linen p-5 space-y-2">
                <p className="font-mono text-[0.75rem] text-ink/70">🚚 Ships within 5–7 days from Delhi NCR</p>
                <p className="font-mono text-[0.75rem] text-ink/70">📦 {shipping === 0 ? 'FREE shipping on this order' : `₹${shipping} flat shipping`}</p>
                <p className="font-mono text-[0.75rem] text-ink/70">↩️ Returns via DM on Instagram only</p>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-linen p-7">
                <h2 className="font-bebas text-ink text-2xl tracking-widest mb-6">ORDER SUMMARY</h2>

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

                {checkoutError && (
                  <p className="mb-4 font-mono text-[0.75rem] text-terracotta leading-relaxed border border-terracotta/30 bg-terracotta/5 px-4 py-3">
                    {checkoutError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="hidden lg:flex w-full bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.15em] uppercase py-4 min-h-[52px] items-center justify-center gap-2 hover:bg-ink transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <><Loader2 size={16} className="animate-spin" /> {paying ? 'Processing Payment…' : 'Creating Order…'}</>
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

        <MobileStickyBar>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[0.65rem] text-ink/60 uppercase tracking-wider">Total</p>
              <p className="font-mono text-lg text-ink font-medium">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={busy}
              className="flex-shrink-0 bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.12em] uppercase px-6 py-3.5 min-h-[52px] flex items-center justify-center gap-2 hover:bg-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Lock size={14} /> Pay
                </>
              )}
            </button>
          </div>
          {checkoutError && (
            <p className="mt-2 font-mono text-[0.68rem] text-terracotta leading-relaxed truncate">{checkoutError}</p>
          )}
        </MobileStickyBar>
      </div>
    </main>
  );
}
