'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONTACT } from '@/lib/site-contact';
import { motion } from 'motion/react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getAllProducts, type Product } from '@/lib/products';
import NavSearch from '@/components/NavSearch';

const HOME_MOBILE_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/track', label: 'Track Order' },
  { href: '/size-guide', label: 'Size Guide' },
] as const;

function FadeInSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    if (product.drop && new Date(product.drop.launch_date) > new Date()) {
      const calculateTimeLeft = () => {
        const diff = new Date(product.drop!.launch_date).getTime() - Date.now();
        if (diff <= 0) return null;
        return {
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        };
      };
      setTimeLeft(calculateTimeLeft());
      const interval = setInterval(() => {
        const newTime = calculateTimeLeft();
        setTimeLeft(newTime);
        if (!newTime) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [product]);

  const isUpcoming = timeLeft !== null;

  return (
    <Link href={`/product/${product.slug}`} className="group cursor-pointer block">
      <div className="aspect-[4/5] bg-linen relative mb-4 overflow-hidden border border-transparent group-hover:border-terracotta transition-colors">
        {product.images[0] && (
          <Image 
            src={product.images[0]} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {!isUpcoming && (
          <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        
        {!isUpcoming && (
          <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="bg-terracotta text-white font-rajdhani font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              View ↗
            </span>
          </div>
        )}

        {isUpcoming && (
          <div className="absolute inset-0 bg-ink/80 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <span className="bg-terracotta text-white font-rajdhani font-bold text-[0.65rem] uppercase tracking-widest px-2 py-1 rounded mb-4 shadow-lg">
              Dropping In
            </span>
            <div className="flex items-center gap-4 text-paper">
              {[
                { l: 'Days', v: timeLeft.d },
                { l: 'Hrs', v: timeLeft.h },
                { l: 'Min', v: timeLeft.m },
                { l: 'Sec', v: timeLeft.s }
              ].map(t => (
                <div key={t.l} className="flex flex-col items-center">
                  <span className="font-bebas text-3xl leading-none">{t.v.toString().padStart(2, '0')}</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-70 mt-1">{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <h3 className="font-rajdhani text-xl md:text-2xl font-bold uppercase tracking-[0.15em] text-ink group-hover:text-terracotta transition-colors">{product.name}</h3>
      <p className="font-mono text-sm text-ink/70 mt-1">₹{product.price.toLocaleString('en-IN')}</p>
    </Link>
  );
}

function DropCard({ drop }: { drop: any }) {
  const [timeLeft, setTimeLeft] = useState<{d:number, h:number, m:number, s:number} | null>(null);

  useEffect(() => {
    if (drop && new Date(drop.launch_date) > new Date()) {
      const calculateTimeLeft = () => {
        const difference = +new Date(drop.launch_date) - +new Date();
        if (difference > 0) {
          return {
            d: Math.floor(difference / (1000 * 60 * 60 * 24)),
            h: Math.floor((difference / (1000 * 60 * 60)) % 24),
            m: Math.floor((difference / 1000 / 60) % 60),
            s: Math.floor((difference / 1000) % 60)
          };
        }
        return null;
      };
      setTimeLeft(calculateTimeLeft());
      const interval = setInterval(() => {
        const newTime = calculateTimeLeft();
        setTimeLeft(newTime);
        if (!newTime) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [drop]);

  const isUpcoming = timeLeft !== null;

  return (
    <Link href="/shop" className="group block cursor-pointer">
      <div className="aspect-[4/5] bg-linen relative mb-4 overflow-hidden border border-transparent group-hover:border-terracotta transition-colors">
        {drop.cover_image ? (
          <Image 
            src={drop.cover_image} 
            alt={drop.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center bg-ink">
            <span className="font-devanagari text-[16rem] text-paper">शहरी</span>
          </div>
        )}

        {isUpcoming ? (
          <div className="absolute inset-0 bg-ink/80 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <span className="bg-terracotta text-white font-rajdhani font-bold text-[0.65rem] uppercase tracking-widest px-2 py-1 rounded mb-4 shadow-lg">
              Dropping In
            </span>
            <div className="flex items-center gap-4 text-paper">
              {[
                { l: 'Days', v: timeLeft.d },
                { l: 'Hrs', v: timeLeft.h },
                { l: 'Min', v: timeLeft.m },
                { l: 'Sec', v: timeLeft.s }
              ].map(t => (
                <div key={t.l} className="flex flex-col items-center">
                  <span className="font-bebas text-3xl leading-none">{t.v.toString().padStart(2, '0')}</span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-70 mt-1">{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-6 flex justify-center bg-gradient-to-t from-ink/60 to-transparent">
              <span className="bg-terracotta text-white font-rajdhani font-bold text-[0.75rem] uppercase tracking-widest px-6 py-2.5 shadow-lg group-hover:bg-ink transition-colors duration-300 border border-terracotta group-hover:border-ink">
                Live Now — Shop Drop
              </span>
            </div>
          </>
        )}
      </div>
      <h3 className="font-rajdhani text-xl md:text-2xl font-bold uppercase tracking-[0.15em] text-ink group-hover:text-terracotta transition-colors">{drop.name}</h3>
      <p className="font-mono text-sm text-ink/70 mt-1 uppercase tracking-wider">{isUpcoming ? 'Collection Preview' : 'Active Collection'}</p>
    </Link>
  );
}

export default function Home() {
  const { itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [upcomingDrop, setUpcomingDrop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navSolid, setNavSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    Promise.all([
      getAllProducts(),
      fetch('/api/drops/upcoming').then(r => r.json()).catch(() => null)
    ])
      .then(([productsData, dropData]) => {
        setProducts(productsData.filter(p => !p.drop || new Date(p.drop.launch_date) <= new Date()));
        setUpcomingDrop(dropData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNavSolid(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-paper w-full selection:bg-terracotta selection:text-white pb-0">
      {/* INTRO ANIMATION */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.8, ease: [0.83, 0, 0.17, 1], delay: 1.8 }}
        className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="overflow-hidden">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.83, 0, 0.17, 1], delay: 0.2 }}
            className="font-bebas text-paper text-5xl md:text-7xl flex items-baseline tracking-widest pt-2"
          >
            THE <span className="font-devanagari tracking-normal text-terracotta mx-3 md:mx-4 -translate-y-1">शहरी</span> CO.
          </motion.div>
        </div>
        <div className="overflow-hidden mt-3 md:mt-4">
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.83, 0, 0.17, 1], delay: 0.4 }}
            className="font-mono text-ink/70 text-[0.75rem] md:text-[0.85rem] tracking-widest"
          >
            EST. {SITE_CONTACT.foundedYear} · DELHI NCR
          </motion.div>
        </div>
      </motion.div>

      {/* HERO — nav lives inside, blends until scroll */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-ink">
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 2.0 }}
          className={`fixed top-0 left-0 w-full z-50 h-16 pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out ${
            navSolid
              ? 'bg-paper/95 backdrop-blur-md border-b border-stone shadow-[0_1px_0_rgba(25,23,20,0.04)]'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          {!navSolid && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/15 to-transparent pointer-events-none"
              aria-hidden
            />
          )}
          <div className="relative z-10 flex h-full w-full items-center justify-between px-4 sm:px-6 md:px-12">
          <Link
            href="/"
            className={`flex flex-row items-baseline gap-1 font-bebas text-xl pt-1 transition-colors duration-500 ${
              navSolid ? 'text-ink' : 'text-paper'
            }`}
          >
            <span className="tracking-wide text-[1.2rem]">THE</span>
            <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
            <span className="tracking-wide text-[1.2rem]">CO.</span>
          </Link>

          <div
            className={`hidden md:flex font-rajdhani text-xs uppercase tracking-[0.2em] gap-8 items-center transition-colors duration-500 ${
              navSolid ? 'text-ink' : 'text-paper/90'
            }`}
          >
            <Link href="/shop" className="relative group hover:text-terracotta transition-colors">
              SHOP
              <span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/about" className="relative group hover:text-terracotta transition-colors">
              ABOUT
              <span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>

          <div
            className={`flex items-center gap-1 sm:gap-2 transition-colors duration-500 ${
              navSolid ? 'text-ink' : 'text-paper'
            }`}
          >
            <NavSearch light={!navSolid} />
            <Link
              href="/cart"
              className="touch-target flex items-center justify-center gap-1.5 hover:text-terracotta transition-colors"
              aria-label={`Cart, ${itemCount} items`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              <span className="font-rajdhani text-xs font-semibold">({itemCount})</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden touch-target flex items-center justify-center hover:text-terracotta transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
          </div>
        </motion.nav>

        {menuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/50"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-0 right-0 h-full w-[min(100%,280px)] bg-paper border-l border-stone shadow-xl flex flex-col pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-4 touch-target flex items-center justify-center text-ink"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
              <nav className="flex flex-col px-6 gap-1">
                {HOME_MOBILE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-rajdhani font-bold text-lg uppercase tracking-[0.15em] text-ink py-3.5 min-h-[48px] flex items-center border-b border-stone/20 hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 2 }}
            className="absolute inset-0"
          >
            <Image
              src="/hero-community.png"
              alt="The Shehri community"
              fill
              unoptimized
              className="object-cover object-[center_28%] sm:object-[center_32%] md:object-[center_38%]"
              sizes="100vw"
              priority
            />
          </motion.div>

          {/* Light targeted scrims — photo stays sharp & visible */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink/55 via-transparent to-transparent md:from-ink/70" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/5 to-ink/20 md:from-ink/80 md:via-ink/10 md:to-transparent" aria-hidden />
          <div
            className="absolute top-[12%] right-0 w-[72%] h-[38%] bg-gradient-to-bl from-paper/12 via-transparent to-transparent md:top-[18%] md:w-[58%] md:h-[42%]"
            aria-hidden
          />

          {/* Ghost collective mark */}
          <span
            className="absolute left-1/2 top-[42%] md:top-[46%] -translate-x-1/2 -translate-y-1/2 font-devanagari text-[min(16rem,52vw)] md:text-[min(22rem,38vw)] text-paper/[0.04] md:text-paper/[0.055] leading-none pointer-events-none select-none"
            aria-hidden
          >
            शहरी
          </span>

          {/* Architectural accent */}
          <div
            className="absolute top-[18%] md:top-[22%] left-[-10%] md:left-0 w-[130%] md:w-[120%] h-px bg-terracotta/40 md:bg-terracotta/45 origin-top-left -rotate-[18deg] md:-rotate-[24deg] pointer-events-none"
            aria-hidden
          />
        </div>

        {/* Print registration marks */}
        <div className="absolute top-[4.75rem] left-4 md:top-[5.5rem] md:left-10 w-5 h-5 md:w-7 md:h-7 border-t border-l border-paper/30 md:border-paper/35 z-20 pointer-events-none" aria-hidden />
        <div className="absolute top-[4.75rem] right-4 md:top-[5.5rem] md:right-10 w-5 h-5 md:w-7 md:h-7 border-t border-r border-paper/30 md:border-paper/35 z-20 pointer-events-none" aria-hidden />
        <div className="absolute bottom-[3.25rem] left-4 md:bottom-[3.75rem] md:left-10 w-5 h-5 md:w-7 md:h-7 border-b border-l border-paper/30 md:border-paper/35 z-20 pointer-events-none" aria-hidden />
        <div className="absolute bottom-[3.25rem] right-4 md:bottom-[3.75rem] md:right-10 w-5 h-5 md:w-7 md:h-7 border-b border-r border-paper/30 md:border-paper/35 z-20 pointer-events-none" aria-hidden />

        {/* Vertical EST rail */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
          className="hidden md:flex absolute left-0 top-[5.5rem] bottom-[3.75rem] w-11 lg:w-12 bg-ink/50 backdrop-blur-[2px] border-r border-paper/10 z-20 items-center justify-center pointer-events-none"
          aria-hidden
        >
          <p className="hero-est-vertical font-mono text-paper/75 text-[0.58rem] uppercase tracking-[0.38em]">
            EST. {SITE_CONTACT.foundedYear} · DELHI NCR
          </p>
        </motion.div>

        <div className="relative z-10 flex-1 flex flex-col min-h-[calc(100dvh-44px-env(safe-area-inset-top,0px))] px-4 sm:px-8 md:pl-16 md:pr-12 lg:pl-20 lg:pr-16 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] md:pt-20 pb-4 md:pb-6">
          {/* Mobile EST */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 2.15 }}
            className="md:hidden mb-3"
          >
            <p className="font-mono text-paper/80 text-[0.58rem] uppercase tracking-[0.32em]">
              EST. {SITE_CONTACT.foundedYear} · DELHI NCR
            </p>
          </motion.div>

          {/* ── MOBILE: editorial split (mirrors laptop) ── */}
          <div className="md:hidden flex-1 flex flex-col">
            <div className="relative flex-1 min-h-[46vh]">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.28 }}
                className="relative z-10 max-w-[88%]"
              >
                <h1 className="font-bebas text-paper text-[clamp(3rem,13.5vw,4.25rem)] leading-[0.88] [text-shadow:0_8px_48px_rgba(0,0,0,0.7)]">
                  FOR THE <span className="text-terracotta">SHEHRI</span>&apos;S,
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.38 }}
                className="absolute top-[clamp(3.75rem,16vw,5.25rem)] right-0 left-3 z-20"
              >
                <div className="hero-mobile-slab ml-auto w-[96%] bg-paper/95 px-5 py-3.5 shadow-[0_24px_64px_rgba(25,23,20,0.32)] border border-paper">
                  <h1 className="font-bebas text-ink text-[clamp(3rem,13.5vw,4.25rem)] leading-[0.88] text-right">
                    BY THE <span className="text-terracotta">SHEHRI</span>&apos;S.
                  </h1>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 2.48 }}
              className="mt-2 flex flex-col items-start gap-3 z-10"
            >
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-rajdhani font-bold uppercase tracking-[0.14em] text-sm px-8 py-3.5 min-h-[48px] shadow-[0_8px_24px_rgba(192,78,24,0.35)] hover:bg-paper hover:text-ink transition-colors duration-300"
              >
                SHOP NOW
                <span className="font-mono font-normal text-xs">↗</span>
              </Link>
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/product/korean-pants"
                  className="inline-flex items-center bg-terracotta text-white font-rajdhani font-bold text-[0.72rem] uppercase tracking-[0.14em] px-4 py-2.5 shadow-[0_8px_24px_rgba(192,78,24,0.35)] hover:bg-ink transition-colors duration-300"
                >
                  KOREAN PANTS&nbsp;&nbsp;₹2,000
                  <span className="font-mono font-normal text-xs ml-1.5">↗</span>
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center border border-paper/35 text-paper font-rajdhani font-bold uppercase tracking-[0.14em] text-[0.72rem] px-5 py-2.5 bg-paper/10 backdrop-blur-sm hover:bg-paper hover:text-ink transition-colors duration-300"
                >
                  OUR STORY
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 2.55 }}
              className="mt-auto pt-8 pb-1"
            >
              <div className="w-10 h-px bg-temple-gold/75 mb-3" aria-hidden />
              <p className="font-mono text-paper/85 text-[0.76rem] leading-[1.75] max-w-[16rem] [text-shadow:0_2px_20px_rgba(0,0,0,0.45)]">
                Bottoms only. Limited stock. No restocks.
              </p>
            </motion.div>
          </div>

          {/* ── DESKTOP: original editorial split ── */}
          <div className="hidden md:flex flex-1 flex-col">
            <div className="flex-1 relative min-h-[52vh]">
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.28 }}
                className="absolute top-0 left-0 max-w-[min(92%,540px)] lg:max-w-[48%] flex flex-col items-start z-10"
              >
                <h1 className="font-bebas text-paper text-[clamp(2.5rem,11.5vw,7rem)] leading-[0.9] [text-shadow:0_6px_40px_rgba(0,0,0,0.65)]">
                  FOR THE <span className="text-terracotta">SHEHRI</span>&apos;S,
                </h1>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex items-center justify-center gap-2 bg-terracotta text-white font-rajdhani font-bold uppercase tracking-[0.14em] text-sm px-8 py-3.5 min-h-[48px] hover:bg-paper hover:text-ink transition-colors duration-300 shadow-[0_8px_24px_rgba(192,78,24,0.35)]"
                >
                  SHOP NOW
                  <span className="font-mono font-normal text-xs">↗</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.38 }}
                className="absolute top-[clamp(5rem,12vw,7rem)] right-0 max-w-[min(96%,620px)] lg:max-w-[52%] flex flex-col items-end z-10"
              >
                <div className="hero-headline-slab inline-block bg-paper/95 px-7 py-4 shadow-[0_20px_60px_rgba(25,23,20,0.28)] border border-paper">
                  <h1 className="font-bebas text-ink text-[clamp(2.5rem,11.5vw,7rem)] leading-[0.9] text-right">
                    BY THE <span className="text-terracotta">SHEHRI</span>&apos;S.
                  </h1>
                </div>
                <Link
                  href="/product/korean-pants"
                  className="mt-3 inline-flex items-center bg-terracotta text-white font-rajdhani font-bold text-[0.78rem] uppercase tracking-[0.14em] px-5 py-2.5 hover:bg-ink transition-colors duration-300 shadow-[0_8px_24px_rgba(192,78,24,0.35)]"
                >
                  KOREAN PANTS&nbsp;&nbsp;₹2,000
                  <span className="font-mono font-normal text-xs ml-1.5">↗</span>
                </Link>
                <Link
                  href="/about"
                  className="mt-3 inline-flex items-center justify-center border border-ink/20 text-ink font-rajdhani font-bold uppercase tracking-[0.14em] text-sm px-8 py-3.5 min-h-[48px] bg-paper/95 hover:bg-ink hover:text-paper hover:border-ink transition-colors duration-300 shadow-[0_12px_32px_rgba(25,23,20,0.12)]"
                >
                  OUR STORY
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 2.52 }}
              className="mt-auto w-full max-w-[1400px] pt-10"
            >
              <div className="max-w-[18rem]">
                <div className="w-10 h-px bg-temple-gold/75 mb-4" aria-hidden />
                <p className="font-mono text-paper/90 text-[0.82rem] leading-[1.75] [text-shadow:0_2px_20px_rgba(0,0,0,0.45)]">
                  Bottoms only. Limited stock. No restocks.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.6 }}
          className="relative z-10 w-full bg-ink overflow-hidden h-[44px] flex items-center shrink-0 border-t border-terracotta/50"
        >
          <div className="flex whitespace-nowrap ticker-animation font-rajdhani text-[0.85rem] font-bold uppercase tracking-[0.25em] text-paper">
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR ·</span>
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR ·</span>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: BRAND MANIFESTO */}
      <section className="bg-ink w-full">
        <FadeInSection className="max-w-[1400px] mx-auto py-32 md:py-40 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div className="flex flex-col w-full">
            <h2 className="font-bebas text-paper text-[5rem] md:text-[6rem] lg:text-[7rem] leading-[0.9] mb-12 md:mb-16 uppercase break-words pt-2">
              TU.
              <br />
              ASLI.
              <br />
              <span className="text-terracotta">SHEHRI.</span>
              <br />
              HAI.
            </h2>
            <div className="w-full h-px bg-temple-gold opacity-50"></div>
            <div className="mt-8">
              <Link
                href="/about"
                className="inline-flex items-center justify-center border border-paper text-paper font-rajdhani text-[0.8rem] font-bold px-8 py-3.5 uppercase tracking-[0.2em] hover:bg-paper hover:text-ink transition-colors duration-300"
              >
                ABOUT US <span className="font-mono font-normal ml-2 text-xs">↗</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-start md:mt-4">
            <div className="font-mono text-[0.95rem] text-stone/80 leading-[1.9] mb-16 whitespace-pre-line tracking-tight">
{`The Shehri Co. makes bottoms.
That's it. That's everything.

Two fits. Korean and Linen.
Structured and easy.
Both limited. Neither restocked.

We don't do logos.
We don't do discounts.
We don't do restocks.

Wear it. Or don't.
But once it's gone —
it's gone.`}
            </div>
            <div className="font-rajdhani text-[0.8rem] font-bold text-terracotta tracking-[0.3em] uppercase">
              DELHI NCR · INDIA
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* SECTION 5: THE DROP */}
      <FadeInSection className="py-16 md:py-20 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <h2 className="font-bebas text-ink text-5xl md:text-[6rem] leading-[0.85] pt-2">THE DROP</h2>
          <div className="flex flex-col md:items-end gap-4 md:mb-3">
            <div className="font-mono text-[0.8rem] text-ink/70">
              {loading ? 'Loading styles...' : `${products.length} style${products.length === 1 ? '' : 's'}. All limited. None coming back.`}
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-terracotta text-white font-rajdhani text-[0.78rem] font-bold px-7 py-3 uppercase tracking-[0.18em] hover:bg-ink transition-colors duration-300"
            >
              VIEW ALL STYLES <span className="font-mono font-normal ml-2 text-xs">↗</span>
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-12 mb-12">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-linen mb-4" />
                <div className="h-6 bg-linen w-1/2 mb-2" />
                <div className="h-4 bg-linen w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 lg:gap-12 mb-12">
            {products.slice(0, upcomingDrop ? 2 : 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            
            {upcomingDrop ? (
              <DropCard drop={upcomingDrop} />
            ) : products.length < 3 ? (
              <div className="aspect-[4/5] bg-ink relative overflow-hidden flex flex-col items-center justify-center p-8 text-center border border-stone/20">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                  <span className="font-devanagari text-[16rem] text-paper">शहरी</span>
                </div>
                <h3 className="font-bebas text-paper text-4xl md:text-5xl tracking-widest mb-3 relative z-10">NEXT DROP</h3>
                <p className="font-mono text-paper/70 text-[0.7rem] uppercase tracking-[0.2em] mb-8 relative z-10">Currently in design</p>
                <Link href="/about" className="font-rajdhani font-bold text-[0.75rem] uppercase tracking-[0.2em] text-paper border border-paper/30 px-6 py-3 hover:bg-paper hover:text-ink transition-colors relative z-10">
                  Read Our Story
                </Link>
              </div>
            ) : null}
          </div>
        )}
        
        <div className="text-center font-mono text-[0.8rem] text-ink/70 tracking-wide">
          Once it's gone, it's gone.
        </div>
      </FadeInSection>

      {/* SECTION 6: KOREAN ACCENT LABEL */}
      <FadeInSection className="w-full bg-linen h-[300px] flex flex-col items-center justify-center text-center px-6">
        <div className="font-korean text-[0.85rem] text-ink/70 tracking-[0.3em] mb-4 opacity-80">
          한국 스트리트 구조 · 인도 거리 문화
        </div>
        <div className="font-mono text-[0.75rem] text-temple-gold opacity-90">
          The aesthetic intersection.
        </div>
      </FadeInSection>

      {/* SECTION 8: CLOSING WORDMARK */}
      <section className="w-full bg-paper pt-32 overflow-hidden flex flex-col items-center">
        <FadeInSection className="w-full flex flex-col items-center">
          <div className="font-mono text-[0.8rem] text-ink/70 text-center mb-16 px-6">
            © {SITE_CONTACT.foundedYear} The Shehri Co. · Delhi NCR · All drops are final.
          </div>
          
          <div className="w-full flex justify-center whitespace-nowrap translate-y-[15%] md:translate-y-[18%]">
            <h2 className="font-bebas text-[28vw] md:text-[20vw] leading-[0.75] text-ink flex items-baseline">
              <span className="tracking-tight">THE</span><span className="font-devanagari text-terracotta mx-[1vw] xl:mx-[1.5vw] transform -translate-y-[2%]">शहरी</span><span className="tracking-tight">CO.</span>
            </h2>
          </div>
        </FadeInSection>
      </section>

      {/* SECTION 9: FOOTER */}
      <footer className="w-full bg-ink pt-24 pb-8 px-6 md:px-12 relative z-10">
        <FadeInSection className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
          <div className="flex flex-col gap-5">
            <div className="font-bebas text-[1.4rem] text-paper flex items-baseline tracking-widest">
              THE <span className="font-devanagari tracking-normal text-terracotta mx-1.5 -translate-y-0.5">शहरी</span> CO.
            </div>
            <div className="font-mono text-[0.75rem] text-stone/70">
              Bottoms only. Delhi NCR.
            </div>
            <a href={SITE_CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.75rem] text-stone/70 underline decoration-stone/40 underline-offset-4 hover:text-paper hover:decoration-paper transition-colors w-fit mt-1">
              Instagram ↗
            </a>
          </div>
          
          <div className="flex flex-col justify-start md:items-center">
            <div className="flex flex-col gap-3 font-rajdhani text-[0.85rem] font-bold uppercase text-stone/70 tracking-[0.2em] leading-loose">
              <Link href="/shop" className="hover:text-paper transition-colors w-fit">SHOP</Link>
              <Link href="/about" className="hover:text-paper transition-colors w-fit">ABOUT</Link>
              <Link href="/track" className="hover:text-paper transition-colors w-fit">TRACK YOUR ORDER</Link>
              <a href={`mailto:${SITE_CONTACT.email}`} className="hover:text-paper transition-colors w-fit">CONTACT</a>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 md:items-end text-left md:text-right mt-4 md:mt-0">
            <div className="font-mono text-[0.75rem] text-stone/70 mb-2">
              No restocks. No discounts.
            </div>
            <div className="font-rajdhani text-[0.8rem] font-bold text-stone/70">
              Returns: DM us.
            </div>
            <a href={SITE_CONTACT.telUrl} className="font-rajdhani text-[0.8rem] font-bold text-stone/70 hover:text-paper transition-colors">
              {SITE_CONTACT.phoneDisplay}
            </a>
            <a href={`mailto:${SITE_CONTACT.email}`} className="font-rajdhani text-[0.8rem] font-bold text-stone/70 hover:text-paper transition-colors">
              {SITE_CONTACT.email}
            </a>
          </div>
        </FadeInSection>
        
        <FadeInSection className="max-w-[1400px] mx-auto border-t border-stone/20 pt-8 text-center md:text-left">
          <div className="font-mono text-[0.7rem] text-stone/50">
            Made in India. Worn everywhere.
          </div>
        </FadeInSection>
      </footer>
    </main>
  );
}
