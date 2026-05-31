'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { getAllProducts, isSoldOut, getAvailableStock, type Product } from '@/lib/products';
import { sortSizes } from '@/lib/sizes';
import { useLiveStockPoll } from '@/lib/useLiveStockPoll';
import { track } from '@/lib/track';
import { StoreNav } from '@/components/StoreNav';

function StockDots({ available }: { available: number }) {
  if (available === 0) return <span className="text-[0.7rem] font-mono text-ink/70 uppercase tracking-wider">Sold out</span>;
  if (available <= 3) return <span className="text-[0.7rem] font-mono text-terracotta uppercase tracking-wider">Only {available} left</span>;
  return <span className="text-[0.7rem] font-mono text-ink/70 uppercase tracking-wider">In stock</span>;
}

function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = isSoldOut(product.variants);
  const lowestStock = Math.min(...product.variants.map(getAvailableStock));
  const isUpcomingDrop = product.drop && new Date(product.drop.launch_date) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={`/product/${product.slug}`} className="group cursor-pointer block">
        <div className="aspect-[4/5] bg-linen relative mb-4 overflow-hidden border border-transparent transition-colors duration-300 group-hover:border-terracotta w-full">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
            />
          )}

          {isUpcomingDrop ? (
            <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center">
              <span className="font-bebas text-paper text-4xl tracking-widest mb-1">DROPPING</span>
              <span className="font-mono text-terracotta text-[0.8rem] tracking-widest uppercase bg-paper px-3 py-1">Soon</span>
            </div>
          ) : soldOut ? (
            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
              <span className="font-bebas text-paper text-3xl tracking-widest">SOLD OUT</span>
            </div>
          ) : (
            <div className="absolute bottom-5 right-5 z-10 bg-terracotta text-white rounded-full px-5 py-2 font-rajdhani text-[0.8rem] tracking-wider font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              VIEW ↗
            </div>
          )}

          {!soldOut && !isUpcomingDrop && lowestStock <= 3 && (
            <div className="absolute top-4 left-4 bg-paper px-3 py-1 font-mono text-[0.65rem] text-terracotta uppercase tracking-widest">
              Almost gone
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-1">
          <div className="font-rajdhani text-[1.1rem] font-bold uppercase tracking-[0.15em] text-ink">
            {product.name}
          </div>
          <div className="font-mono text-[0.9rem] text-ink/70">
            {isUpcomingDrop ? 'TBA' : `₹${product.price.toLocaleString('en-IN')}`}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {sortSizes(new Set(product.variants.map((v) => v.size))).map((size) => {
              const sizeVariants = product.variants.filter((v) => v.size === size);
              const isAvailable = sizeVariants.some((v) => getAvailableStock(v) > 0);
              return (
                <span
                  key={size}
                  className={`font-mono text-[0.65rem] tracking-widest px-1.5 py-0.5 border ${
                    !isUpcomingDrop && !isAvailable
                      ? 'border-stone/30 text-ink/70 line-through'
                      : 'border-stone text-ink/70'
                  }`}
                >
                  {size}
                </span>
              );
            })}
          </div>
          {isUpcomingDrop ? (
            <span className="text-[0.65rem] font-mono text-terracotta uppercase tracking-widest font-bold">Preview</span>
          ) : (
            <StockDots available={lowestStock} />
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    const p = await getAllProducts();
    setProducts(p);
  }, []);

  useEffect(() => {
    track('page_view', { page: '/shop' });
    getAllProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  useLiveStockPoll(refreshProducts);

  return (
    <main className="min-h-screen bg-paper w-full selection:bg-terracotta selection:text-white">
      <StoreNav active="shop" />

      <div className="safe-nav-offset">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="px-4 sm:px-6 md:px-12 pt-10 sm:pt-16 pb-12 max-w-[1400px] mx-auto"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[0.75rem] text-ink/70 hover:text-ink transition-colors mb-10 uppercase tracking-widest"
          >
            <ArrowLeft size={12} /> Back
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-bebas text-ink text-6xl md:text-[8rem] leading-[0.85] pt-2">
              THE DROP
            </h1>
            <div className="font-mono text-[0.8rem] text-ink/70 md:mb-3 max-w-xs">
              {products.length} styles. Both limited. Neither coming back.
            </div>
          </div>
        </motion.section>

        {/* Ticker */}
        <div className="w-full bg-ink overflow-hidden h-[40px] flex items-center border-y border-stone/20 mb-10">
          <div className="flex whitespace-nowrap ticker-animation font-rajdhani text-[0.75rem] font-bold uppercase tracking-[0.25em] text-paper">
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
          </div>
        </div>

        {/* Product Grid */}
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto pb-20">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-12">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-linen mb-4 w-full" />
                  <div className="h-4 bg-linen w-1/2 mb-2" />
                  <div className="h-3 bg-linen w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-12">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index === 0} />
              ))}
              
              {/* Filler Card */}
              <div className="hidden lg:block group">
                <div className="aspect-[4/5] bg-linen/50 border border-stone/20 relative mb-4 flex items-center justify-center overflow-hidden w-full">
                  <div className="flex flex-col items-center text-center px-6 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    <h3 className="font-bebas text-ink text-4xl tracking-widest mb-2">ARCHIVE</h3>
                    <p className="font-mono text-ink/70 text-[0.7rem] uppercase tracking-widest">More drops loading...</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-1 invisible">
                  <div className="font-rajdhani text-[1.1rem] font-bold uppercase tracking-[0.15em]">Placeholder</div>
                  <div className="font-mono text-[0.9rem]">₹0</div>
                </div>
                <div className="flex items-center justify-between invisible">
                  <div className="font-mono text-[0.65rem] tracking-widest px-1.5 py-0.5 border">S</div>
                  <span className="text-[0.7rem] font-mono">In stock</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center font-mono text-[0.75rem] text-ink/70 tracking-wide mt-16">
            Once it&apos;s gone, it&apos;s gone.
          </div>
        </section>
      </div>
    </main>
  );
}
