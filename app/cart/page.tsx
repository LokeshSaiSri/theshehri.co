'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { track } from '@/lib/track';
import { StoreNav } from '@/components/StoreNav';
import { MobileStickyBar } from '@/components/MobileStickyBar';

export default function CartPage() {
  const { items, removeItem, subtotal, shipping, total, itemCount, untilFreeShipping } = useCart();
  const untilFree = untilFreeShipping;

  useEffect(() => {
    track('cart_viewed', { metadata: { item_count: itemCount } });
  }, [itemCount]);

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      <StoreNav />

      <div className="safe-nav-offset max-w-[1100px] mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 mobile-sticky-offset">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-bebas text-ink text-5xl md:text-7xl leading-[0.85] mb-12 pt-2">
            YOUR BAG
          </h1>

          {itemCount === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="font-bebas text-ink/70 text-[8rem] leading-none mb-4 select-none">
                ∅
              </div>
              <p className="font-mono text-[0.85rem] text-ink/70 mb-2">Your bag is empty.</p>
              <p className="font-mono text-[0.75rem] text-ink/70 mb-10">
                Limited stock. Don&apos;t wait too long.
              </p>
              <Link
                href="/shop"
                className="bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-ink transition-colors duration-300 flex items-center gap-2"
              >
                GO BACK TO THE DROP <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16">

              {/* Items */}
              <div>
                {/* Free shipping nudge */}
                {untilFree > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-linen border border-stone/20 px-5 py-4 mb-8"
                  >
                    <p className="font-mono text-[0.75rem] text-ink">
                      Add items worth <span className="text-terracotta font-medium">₹{untilFree.toLocaleString('en-IN')}</span> more for <span className="font-medium">free shipping</span>
                    </p>
                  </motion.div>
                )}
                {shipping === 0 && subtotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-ink px-5 py-4 mb-8"
                  >
                    <p className="font-mono text-[0.75rem] text-paper">
                      ✓ Free shipping unlocked
                    </p>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.size}`}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-5 py-7 border-b border-stone/20 last:border-b-0"
                    >
                      {/* Image */}
                      <div className="w-24 h-28 md:w-28 md:h-36 relative bg-linen flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="112px" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-rajdhani font-bold text-[1rem] uppercase tracking-[0.1em] text-ink">
                                {item.productName}
                              </p>
                              <p className="font-mono text-[0.75rem] text-ink/70 mt-1">
                                {item.color ? `${item.color} · ` : ''}Size <span className="text-ink">{item.size}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                removeItem(item.productId, item.size, item.color);
                                track('remove_from_cart', { product_slug: item.productSlug, size: item.size, color: item.color });
                              }}
                              className="touch-target flex items-center justify-center text-ink/70 hover:text-ink transition-colors flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[0.7rem] text-ink/70">Qty: 1</span>
                          <span className="font-mono text-[0.95rem] text-ink">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-linen p-7">
                  <h2 className="font-bebas text-ink text-2xl tracking-widest mb-7">ORDER SUMMARY</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-[0.8rem] text-ink/70">Subtotal</span>
                      <span className="font-mono text-[0.9rem] text-ink">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-[0.8rem] text-ink/70">Shipping</span>
                      <span className={`font-mono text-[0.9rem] ${shipping === 0 ? 'text-ink' : 'text-ink'}`}>
                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                      </span>
                    </div>
                    <div className="w-full h-px bg-stone/30 my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="font-rajdhani font-bold text-[0.85rem] uppercase tracking-widest text-ink">Total</span>
                      <span className="font-mono text-[1.1rem] text-ink font-medium">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={() => track('checkout_started', { metadata: { items: itemCount, total } })}
                    className="hidden lg:flex w-full bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.15em] uppercase py-4 min-h-[52px] items-center justify-center gap-2 hover:bg-ink transition-colors duration-300 mb-4"
                  >
                    PROCEED TO CHECKOUT <ArrowRight size={16} />
                  </Link>

                  <Link
                    href="/shop"
                    className="w-full border border-stone text-ink/70 font-rajdhani font-bold text-sm tracking-[0.12em] uppercase py-3.5 flex items-center justify-center hover:border-ink hover:text-ink transition-colors duration-300"
                  >
                    Continue Shopping
                  </Link>

                  <div className="mt-6 space-y-1.5">
                    <p className="font-mono text-[0.68rem] text-ink/70">📦 Ships within 5–7 days</p>
                    <p className="font-mono text-[0.68rem] text-ink/70">🔒 Secure checkout via Razorpay</p>
                    <p className="font-mono text-[0.68rem] text-ink/70">↩️ Returns via DM only</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {itemCount > 0 && (
        <MobileStickyBar>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[0.65rem] text-ink/60 uppercase tracking-wider">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              <p className="font-mono text-lg text-ink font-medium">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <Link
              href="/checkout"
              onClick={() => track('checkout_started', { metadata: { items: itemCount, total } })}
              className="flex-shrink-0 bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.12em] uppercase px-6 py-3.5 min-h-[52px] flex items-center justify-center gap-2 hover:bg-ink transition-colors"
            >
              Checkout <ArrowRight size={16} />
            </Link>
          </div>
        </MobileStickyBar>
      )}
    </main>
  );
}
