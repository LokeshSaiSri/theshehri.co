'use client';

import React, { useEffect, useState, FormEvent, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  getAllProducts,
  getAvailableStock,
  type Product,
  type Size,
} from '@/lib/products';

const CONTAINER = 'max-w-[1400px] mx-auto w-full px-6 md:px-12';
const EASE = [0.16, 1, 0.3, 1] as const;

function scrollToSection(id: string, e?: React.MouseEvent<HTMLElement>) {
  e?.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

type Countdown = { d: number; h: number; m: number; s: number };

function useCountdown(target: string | null) {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        setClosed(true);
        return;
      }
      setClosed(false);
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return { countdown, closed };
}

function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountdownSlash({ c }: { c: Countdown }) {
  const parts = [
    { key: 'd', val: c.d },
    { key: 'h', val: c.h },
    { key: 'm', val: c.m },
    { key: 's', val: c.s },
  ];
  return (
    <p className="font-bebas text-3xl md:text-5xl lg:text-6xl tracking-tight tabular-nums flex flex-wrap items-baseline gap-x-1">
      {parts.map((p, i) => (
        <span key={p.key} className="inline-flex items-baseline">
          <motion.span
            key={`${p.key}-${p.val}`}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {String(p.val).padStart(2, '0')}
          </motion.span>
          {i < parts.length - 1 && (
            <span className="text-terracotta mx-0.5 md:mx-1">/</span>
          )}
        </span>
      ))}
    </p>
  );
}

function inventoryFromProducts(products: Product[]) {
  let total = 0;
  let remaining = 0;
  let reserved = 0;
  for (const p of products) {
    for (const v of p.variants ?? []) {
      total += v.stock;
      remaining += getAvailableStock(v);
      reserved += v.reserved;
    }
  }
  return {
    total: Math.max(total, 1),
    remaining,
    reserved: reserved || Math.max(0, total - remaining),
  };
}

function AnimatedUnitWall({ total, taken }: { total: number; taken: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const cells = Math.min(100, total);
  const filled = Math.min(cells, Math.round((taken / total) * cells));

  return (
    <div ref={ref} className="w-full max-w-md mx-auto">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        aria-hidden
      >
        {Array.from({ length: cells }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              inView
                ? {
                    opacity: 1,
                    scale: 1,
                    backgroundColor: i < filled ? '#C04E18' : 'rgba(246, 243, 238, 0.1)',
                  }
                : { opacity: 0, scale: 0.6 }
            }
            transition={{
              duration: 0.35,
              delay: i * 0.012,
              ease: EASE,
            }}
            className="aspect-square border border-paper/10"
          />
        ))}
      </div>
    </div>
  );
}

const polaroidStackVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 64,
    scale: 0.9,
    filter: 'blur(6px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -64,
    scale: 0.9,
    filter: 'blur(6px)',
  }),
};

function PolaroidStack({
  product,
  direction,
  onSelectNext,
}: {
  product: Product;
  direction: number;
  onSelectNext?: () => void;
}) {
  const primarySrc = product.images[0];
  const secondarySrc = product.images[1];
  const interactive = Boolean(onSelectNext);

  return (
    <div
      className={`absolute inset-0 overflow-hidden group ${interactive ? 'cursor-pointer' : ''}`}
      onClick={interactive ? onSelectNext : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectNext?.();
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Next style — tap to switch product' : undefined}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={product.id}
          custom={direction}
          variants={polaroidStackVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: EASE }}
          className="absolute inset-0"
        >
          {primarySrc ? (
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[72%] max-w-[320px] aspect-[3/4] border-2 border-ink bg-paper shadow-[8px_12px_0_#191714] -rotate-3 z-10 drop-card-hover overflow-hidden">
              <div className="absolute inset-0 bottom-[2.25rem]">
                <Image
                  src={primarySrc}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="320px"
                  priority
                />
              </div>
              <p className="absolute bottom-0 left-0 right-0 bg-paper font-mono text-[0.55rem] p-2.5 uppercase tracking-widest border-t border-ink">
                {product.name}
              </p>
            </div>
          ) : (
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[72%] max-w-[320px] aspect-[3/4] border-2 border-ink bg-linen shadow-[8px_12px_0_#191714] -rotate-3 z-10 flex items-center justify-center">
              <span className="font-devanagari text-6xl text-terracotta/20">शहरी</span>
            </div>
          )}

          {secondarySrc && (
            <div className="drop-polaroid-secondary absolute top-[20%] right-[6%] md:right-[10%] w-[42%] max-w-[180px] aspect-square border-2 border-ink bg-paper rotate-6 opacity-90 z-0 overflow-hidden shadow-[4px_6px_0_#191714]">
              <Image src={secondarySrc} alt="" fill className="object-cover" sizes="180px" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const METRO_STOPS = [
  { stop: '01', place: 'Size lock', sub: 'Aaj · ₹0' },
  { stop: '02', place: 'Email', sub: 'Private link' },
  { stop: '03', place: 'Checkout', sub: 'Pehle tum' },
  { stop: '04', place: 'Street', sub: 'Phir sab' },
] as const;

export default function PreLaunchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drop, setDrop] = useState<{ name: string; launch_date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [swapDir, setSwapDir] = useState(1);
  const [size, setSize] = useState<Size | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const product = products[idx] ?? null;
  const { countdown, closed } = useCountdown(drop?.launch_date ?? null);
  const inv = useMemo(() => inventoryFromProducts(products), [products]);

  const sizeStock = useMemo(() => {
    const m = new Map<Size, number>();
    if (!product) return m;
    for (const v of product.variants ?? []) {
      m.set(v.size, (m.get(v.size) ?? 0) + getAvailableStock(v));
    }
    return m;
  }, [product]);

  const sizes = useMemo(() => Array.from(sizeStock.keys()).sort(), [sizeStock]);
  const batchId = `B001-${String(inv.reserved + 1).padStart(4, '0')}`;

  const selectProduct = (nextIdx: number) => {
    setSwapDir(nextIdx > idx ? 1 : -1);
    setIdx(nextIdx);
  };

  useEffect(() => {
    Promise.all([
      getAllProducts(),
      fetch('/api/drops/upcoming')
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([p, d]) => {
        setProducts(p);
        if (d?.launch_date) setDrop(d);
      })
      .finally(() => setLoading(false));

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        fetch('/api/admin/unlock', { method: 'POST' }).then(() => {
          window.location.href = '/admin/login';
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setSize('');
    setDone(false);
    setErr(null);
  }, [idx]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!product || !size) {
      setErr('Size pick karo pehle.');
      return;
    }
    if ((sizeStock.get(size) ?? 0) === 0) {
      setErr('Woh size ab gayi.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const res = await fetch('/api/preorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone') || undefined,
          size,
          product: product.name,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setErr('Nahi hua. Phir try karo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="drop-snap-y bg-paper text-ink overflow-x-hidden selection:bg-terracotta selection:text-white">
      {/* COVER */}
      <section className="drop-snap-section relative min-h-[100dvh] bg-ink flex flex-col">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          <motion.span
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="absolute -right-[6vw] top-[4vh] font-bebas text-[min(40vw,26rem)] leading-none text-paper/[0.045]"
          >
            001
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.14 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute left-[5vw] bottom-[20vh] font-devanagari text-[min(26vw,14rem)] text-terracotta leading-none"
          >
            शहरी
          </motion.span>
        </div>

        <header className={`relative z-10 flex justify-between items-start pt-6 md:pt-8 ${CONTAINER}`}>
          <span className="font-bebas text-paper text-lg md:text-xl tracking-wide">
            THE <span className="font-devanagari text-terracotta">शहरी</span> CO.
          </span>
          <span className="font-mono text-[0.6rem] md:text-[0.65rem] text-paper/45 uppercase tracking-[0.32em] hidden sm:block text-right max-w-[140px] leading-relaxed">
            Delhi NCR only — for now
          </span>
        </header>

        <div className={`relative z-10 flex-1 flex flex-col justify-center py-12 md:py-16 ${CONTAINER}`}>
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="font-mono text-terracotta text-[0.68rem] uppercase tracking-[0.38em] mb-5 md:mb-6"
            >
              {closed ? 'Window band' : 'Preorder window khuli hai'}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
              className="font-bebas text-paper leading-[0.84] mb-6 md:mb-8"
            >
              <span className="block text-[clamp(3.25rem,13vw,8.5rem)]">DROP</span>
              <span className="block text-[clamp(3.25rem,13vw,8.5rem)] text-terracotta -mt-1 md:-mt-3">
                PEHLE
              </span>
              <span className="block text-[clamp(1.35rem,4.5vw,2.75rem)] text-paper/55 font-rajdhani font-semibold tracking-[0.18em] uppercase mt-3 md:mt-5">
                public ko dikhne se pehle
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.6 }}
              className="font-mono text-paper/55 text-sm md:text-[0.9rem] max-w-md leading-[1.75] mb-8 md:mb-10"
            >
              Bottoms only. Size lock = ₹0 aaj. Jab store live hoga, tumhe pehle link milega.
            </motion.p>

            {!closed && (
              <motion.a
                href="#choose"
                onClick={(e) => scrollToSection('choose', e)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, ease: EASE }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="drop-btn inline-flex items-center justify-center bg-paper text-ink font-rajdhani font-bold uppercase tracking-[0.18em] text-sm px-8 py-4 min-h-[52px] hover:bg-terracotta hover:text-paper"
              >
                Size lock karo ↗
              </motion.a>
            )}
          </div>
        </div>

        <div className="relative z-10 bg-paper text-ink border-t-2 border-terracotta mt-auto">
          <div className={`${CONTAINER} py-4 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6`}>
            {countdown && !closed ? (
              <CountdownSlash c={countdown} />
            ) : (
              <p className="font-bebas text-2xl md:text-3xl text-terracotta">
                {closed ? 'BAND HO GAYA' : 'TIMING TBA'}
              </p>
            )}
            <p className="font-mono text-[0.62rem] md:text-[0.65rem] uppercase tracking-[0.18em] text-ink/50 sm:text-right sm:max-w-[220px] leading-relaxed">
              {inv.remaining} pairs left · batch 001 · no restock
            </p>
          </div>
          <div className="overflow-hidden border-t border-ink/10 h-9 md:h-10 flex items-center bg-ink">
            <div className="flex whitespace-nowrap ticker-animation font-rajdhani text-[0.68rem] md:text-[0.7rem] font-bold uppercase tracking-[0.26em] text-paper">
              <span className="px-4">
                LAJPAT · SHAHPUR JAT · MAJNU KA TILLA · FIT WITH NO LOGO · शहरी · BOTTOMS ONLY ·
              </span>
              <span className="px-4">
                LAJPAT · SHAHPUR JAT · MAJNU KA TILLA · FIT WITH NO LOGO · शहरी · BOTTOMS ONLY ·
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* THE PAIR */}
      <section
        id="choose"
        className="drop-snap-section min-h-[100dvh] border-b border-stone bg-paper"
      >
        <div className={`${CONTAINER} lg:max-w-none lg:px-0`}>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(420px,38vw)] min-h-[100dvh]">
            <div className="px-6 md:px-12 lg:pl-12 lg:pr-8 py-14 md:py-20 flex flex-col justify-center order-2 lg:order-1">
              <Reveal>
                <p className="font-mono text-[0.65rem] text-terracotta uppercase tracking-[0.32em] mb-6 md:mb-8">
                  Chapter 01 — choose
                </p>
              </Reveal>

              {products.length > 1 && (
                <Reveal delay={0.05} className="flex gap-0 mb-8 md:mb-10 border-b border-stone">
                  {products.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(i)}
                      className={`drop-btn font-bebas text-4xl md:text-5xl px-4 md:px-5 py-2 border-b-2 -mb-px min-h-[52px] ${
                        idx === i
                          ? 'border-terracotta text-ink'
                          : 'border-transparent text-ink/25 hover:text-ink hover:border-ink/20'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
                </Reveal>
              )}

              {loading || !product ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-8 bg-linen w-2/3" />
                  <div className="h-12 bg-linen w-1/3" />
                </div>
              ) : (
                <div>
                  <h2 className="font-rajdhani font-bold uppercase tracking-[0.12em] text-2xl md:text-4xl mb-2">
                    {product.name}
                  </h2>
                  <p className="font-bebas text-5xl md:text-6xl text-terracotta mb-5 md:mb-6">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                  <p className="font-mono text-sm text-ink/65 leading-[1.75] max-w-md mb-8 md:mb-10">
                    {product.description ||
                      'Structured fit. Street cut. Pockets that actually hold your phone and your attitude.'}
                  </p>

                  <div className="relative mb-2">
                    <div className="absolute top-3 left-0 right-0 h-px bg-stone" />
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink/45 mb-5 relative inline-block bg-paper pr-3">
                      Size (live stock)
                    </p>
                    <div className="flex flex-wrap gap-2.5 md:gap-3">
                      {sizes.map((s) => {
                        const left = sizeStock.get(s) ?? 0;
                        const out = left === 0;
                        const low = left > 0 && left <= 3;
                        const selected = size === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={out}
                            onClick={() => setSize(s)}
                            className={`drop-btn relative font-mono text-xs uppercase px-3.5 py-2.5 border-2 bg-paper min-h-[44px] disabled:opacity-35 disabled:cursor-not-allowed ${
                              selected
                                ? 'border-terracotta -rotate-2 shadow-[3px_4px_0_#C04E18]'
                                : 'border-ink rotate-1 shadow-[2px_3px_0_#191714] hover:-translate-y-1 hover:shadow-[4px_5px_0_#191714]'
                            }`}
                          >
                            {s}
                            {low && !out && (
                              <span className="absolute -top-2 -right-2 bg-terracotta text-paper text-[0.5rem] px-1.5 py-0.5 font-bold">
                                {left}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <a
                    href="#hold"
                    onClick={(e) => scrollToSection('hold', e)}
                    className="group inline-flex items-center gap-2 mt-8 font-rajdhani font-bold uppercase tracking-[0.14em] text-sm text-terracotta hover:text-ink transition-colors drop-ease"
                  >
                    <span className="transition-transform group-hover:translate-y-1 drop-ease">↓</span>
                    Permit form neeche hai
                    <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all drop-ease">
                      ↗
                    </span>
                  </a>
                </div>
              )}
            </div>

            <div className="relative bg-linen border-t lg:border-t-0 lg:border-l border-stone order-1 lg:order-2 min-h-[48vh] sm:min-h-[52vh] lg:min-h-0 lg:sticky lg:top-0 lg:h-screen">
              {product ? (
                <PolaroidStack
                  product={product}
                  direction={swapDir}
                  onSelectNext={
                    products.length > 1
                      ? () => selectProduct((idx + 1) % products.length)
                      : undefined
                  }
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-devanagari text-[min(8rem,30vw)] text-terracotta/12">
                  शहरी
                </div>
              )}
              <p className="absolute bottom-5 left-6 md:left-8 right-6 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink/40 max-w-[200px] leading-relaxed z-20">
                Photo: batch 001 sample. Fit may vary ±1cm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INVENTORY */}
      <section className="drop-snap-section bg-ink text-paper py-20 md:py-28">
        <div className={`${CONTAINER} max-w-2xl text-center`}>
          <Reveal>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-terracotta mb-4">
              Chapter 02 — what&apos;s left
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <motion.p
              key={inv.remaining}
              initial={{ scale: 0.92, opacity: 0.5 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="font-bebas text-[clamp(4.5rem,18vw,10rem)] leading-none text-terracotta mb-2"
            >
              {inv.remaining}
            </motion.p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="font-mono text-paper/50 text-xs md:text-sm uppercase tracking-[0.2em] mb-10 md:mb-12">
              pairs still in batch 001
            </p>
          </Reveal>
          <AnimatedUnitWall total={inv.total} taken={inv.reserved} />
          <Reveal delay={0.2}>
            <p className="font-mono text-[0.68rem] md:text-[0.7rem] text-paper/40 mt-8 md:mt-10 leading-relaxed max-w-sm mx-auto">
              Each square = one unit from this run. Jab bhar jaye, batch band.
            </p>
          </Reveal>
        </div>
      </section>

      {/* METRO */}
      <section className="py-16 md:py-24 border-b border-stone bg-paper">
        <div className={CONTAINER}>
          <Reveal>
            <p className="font-mono text-[0.65rem] text-terracotta uppercase tracking-[0.32em] mb-10 md:mb-12">
              Route map
            </p>
          </Reveal>
          <div className="max-w-3xl mx-auto relative pt-4 pb-2">
            <div className="absolute top-[1.125rem] left-0 right-0 h-px bg-stone" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
              {METRO_STOPS.map((s, i) => (
                <Reveal key={s.stop} delay={i * 0.07} y={20}>
                  <div className="group relative pt-8 md:pt-9">
                    <span className="absolute top-0 left-0 w-4 h-4 rounded-full bg-terracotta border-2 border-paper shadow-sm transition-transform duration-300 group-hover:scale-125" />
                    <p className="font-bebas text-3xl md:text-4xl text-ink/15 group-hover:text-terracotta/40 transition-colors drop-ease">
                      {s.stop}
                    </p>
                    <p className="font-rajdhani font-bold uppercase tracking-[0.1em] text-sm md:text-base mt-2 group-hover:text-terracotta transition-colors drop-ease">
                      {s.place}
                    </p>
                    <p className="font-mono text-[0.62rem] md:text-[0.65rem] text-ink/50 mt-1.5">{s.sub}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PERMIT */}
      <section id="hold" className="drop-snap-section scroll-mt-20 py-16 md:py-24 bg-linen">
        <div className={`${CONTAINER} flex justify-center`}>
          <Reveal className="w-full max-w-xl relative">
            <span className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-ink transition-opacity hover:opacity-100 opacity-70" />
            <span className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-ink opacity-70" />
            <span className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-ink opacity-70" />
            <span className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-ink opacity-70" />

            <div className="border-2 border-dashed border-ink bg-paper p-7 md:p-10 transition-shadow duration-500 hover:shadow-[0_20px_60px_rgba(25,23,20,0.08)]">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 pb-6 border-b border-stone">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-terracotta">
                    Preorder permit
                  </p>
                  <p className="font-bebas text-2xl md:text-3xl mt-1 leading-none">SIZE HOLD REQUEST</p>
                </div>
                <p className="font-mono text-[0.58rem] text-ink/45 uppercase tracking-[0.2em] sm:text-right shrink-0">
                  {batchId}
                  <br />
                  Drop 001
                </p>
              </div>

              <AnimatePresence mode="wait">
                {closed ? (
                  <motion.p
                    key="closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-bebas text-3xl md:text-4xl text-terracotta"
                  >
                    Window band. Next batch soon.
                  </motion.p>
                ) : done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ ease: EASE }}
                    className="text-center py-6 md:py-8"
                  >
                    <div className="permit-stamp inline-block border-4 border-terracotta text-terracotta font-bebas text-xl md:text-2xl px-6 py-3 mb-6 uppercase tracking-widest">
                      Approved
                    </div>
                    <p className="font-rajdhani font-bold uppercase tracking-[0.14em] text-lg md:text-xl mb-2">
                      Batch 001 mein aa gaye.
                    </p>
                    <p className="font-mono text-sm text-ink/60">
                      {product?.name} · size {size}. Inbox check karo.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    onSubmit={submit}
                    initial={false}
                    className="space-y-5"
                  >
                    <p className="font-mono text-xs text-ink/50 leading-relaxed border-l-2 border-terracotta pl-3">
                      Item: <strong className="text-ink">{product?.name ?? '—'}</strong>
                      {size && (
                        <>
                          {' '}
                          · Size <strong>{size}</strong>
                        </>
                      )}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <label className="block">
                        <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink/50 block mb-1.5">
                          Naam
                        </span>
                        <input
                          name="name"
                          required
                          className="drop-input w-full border-b-2 border-stone bg-transparent py-2.5 font-mono text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink/50 block mb-1.5">
                          Email
                        </span>
                        <input
                          type="email"
                          name="email"
                          required
                          className="drop-input w-full border-b-2 border-stone bg-transparent py-2.5 font-mono text-sm"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="font-mono text-[0.58rem] uppercase tracking-widest text-ink/50 block mb-1.5">
                        Phone (optional)
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        className="drop-input w-full border-b-2 border-stone bg-transparent py-2.5 font-mono text-sm"
                      />
                    </label>

                    {err && (
                      <motion.p
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-mono text-xs text-terracotta"
                      >
                        {err}
                      </motion.p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={submitting || !product}
                      whileHover={!submitting && product ? { scale: 1.01 } : undefined}
                      whileTap={!submitting && product ? { scale: 0.99 } : undefined}
                      className="drop-btn w-full bg-ink text-paper font-rajdhani font-bold uppercase tracking-[0.14em] py-4 mt-2 min-h-[52px] hover:bg-terracotta disabled:opacity-50 disabled:hover:transform-none"
                    >
                      {submitting ? 'Submit ho raha hai...' : 'Permit submit karo ↗'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              <p className="font-mono text-[0.52rem] md:text-[0.55rem] text-ink/35 mt-8 uppercase tracking-[0.2em] text-center">
                The Shehri Co. · Delhi NCR · No restock on 001
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-20 md:py-28 bg-ink overflow-hidden">
        <div className={CONTAINER}>
          <Reveal>
            <blockquote className="max-w-4xl">
              <p className="font-bebas text-paper text-[clamp(1.85rem,5.5vw,4.25rem)] leading-[0.95]">
                &ldquo;Neeche se fit aata hai.
                <span className="text-terracotta"> Logo nahi.</span>
                &rdquo;
              </p>
              <footer className="mt-6 md:mt-8 font-mono text-[0.62rem] md:text-[0.65rem] text-paper/40 uppercase tracking-[0.22em]">
                — every shehri who gets it
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* END CAP */}
      <section className="bg-terracotta text-paper py-16 md:py-20">
        <div className={`${CONTAINER} text-center flex flex-col items-center`}>
          <Reveal>
            {!closed && countdown && (
              <p className="font-bebas text-4xl md:text-6xl lg:text-7xl tabular-nums mb-5 md:mb-6 tracking-tight">
                {String(countdown.d).padStart(2, '0')}:{String(countdown.h).padStart(2, '0')}:
                {String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
              </p>
            )}
            <p className="font-rajdhani font-bold uppercase tracking-[0.18em] text-sm mb-6 md:mb-8 max-w-md">
              Timer zero = batch band. Phir waitlist.
            </p>
            {!closed && product && (
              <motion.a
                href="#hold"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="drop-btn inline-flex items-center justify-center bg-paper text-ink font-rajdhani font-bold uppercase tracking-[0.12em] px-10 py-4 min-h-[52px] hover:bg-ink hover:text-paper"
              >
                Abhi lock karo — ₹{product.price.toLocaleString('en-IN')} ↗
              </motion.a>
            )}
          </Reveal>
        </div>
      </section>

      <footer className={`${CONTAINER} py-6 border-t border-stone`}>
        <p className="font-mono text-[0.6rem] text-ink/40 uppercase tracking-[0.2em] text-center">
          hello@theshehrico.in
        </p>
      </footer>

      {!done && !closed && product && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t-2 border-ink bg-paper/95 backdrop-blur-md p-3"
        >
          <a
            href="#hold"
            className="drop-btn flex items-center justify-center bg-terracotta text-paper font-rajdhani font-bold uppercase tracking-wider py-3.5 text-sm min-h-[52px] hover:bg-ink"
          >
            Permit form ↗
          </a>
        </motion.div>
      )}
    </div>
  );
}
