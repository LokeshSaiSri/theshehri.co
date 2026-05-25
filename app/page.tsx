'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getAllProducts, type Product } from '@/lib/products';
import NavSearch from '@/components/NavSearch';

function FadeInSection({ children, className }: { children: React.ReactNode, className?: string }) {
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
            EST. 2025 · DELHI NCR
          </motion.div>
        </div>
      </motion.div>

      {/* SECTION 1: NAV */}
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 2.0 }}
        className="fixed top-0 left-0 w-full bg-paper border-b border-stone z-50 flex items-center justify-between px-6 md:px-12 h-16"
      >
        <Link href="/" className="flex flex-row items-baseline gap-1 font-bebas text-ink text-xl pt-1">
          <span className="tracking-wide text-[1.2rem]">THE</span>
          <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
          <span className="tracking-wide text-[1.2rem]">CO.</span>
        </Link>
        
        <div className="hidden md:flex font-rajdhani text-xs uppercase tracking-[0.2em] text-ink gap-8 items-center">
          <Link href="/shop" className="relative group">SHOP<span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full"></span></Link>
          <Link href="/about" className="relative group">ABOUT<span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full"></span></Link>
        </div>
        
        <div className="flex items-center gap-6 text-ink">
          <NavSearch />
          <Link href="/cart" className="flex items-center gap-1.5 hover:text-terracotta transition-colors">
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="font-rajdhani text-xs font-semibold">({itemCount})</span>
          </Link>
        </div>
      </motion.nav>

      {/* SECTION 2: HERO */}
      <section className="min-h-[100dvh] bg-paper flex flex-col pt-16 relative overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row relative w-full">
        
        {/* Absolute watermark */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 2.3 }}
          className="absolute -left-12 md:left-[5%] top-[10%] md:top-[20%] font-devanagari text-[18rem] md:text-[28vw] lg:text-[30vw] text-terracotta leading-none pointer-events-none z-0 select-none"
        >
          शहरी
        </motion.div>

        {/* Left Column */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 2.1 }}
          className="w-full md:w-[45%] flex flex-col justify-center px-6 md:px-12 py-20 relative z-10"
        >
          <div className="font-mono text-ink/70 text-[0.75rem] mb-12 md:mb-20 uppercase relative z-20">EST. 2025 · DELHI NCR</div>
          
          <div className="relative z-20 mb-8 mt-auto md:mt-0">
            <h1 className="font-bebas text-7xl md:text-[5rem] lg:text-[6rem] xl:text-[7rem] text-ink leading-[0.85]">
              FIT WITH<br/>NO LOGO.
            </h1>
          </div>
          
          <p className="font-mono text-ink/70 text-[0.85rem] mb-12 relative z-20 max-w-sm">
            Bottoms only. Limited stock. No restocks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-20 mt-auto md:mt-0">
            <Link href="/shop" className="bg-terracotta text-white font-rajdhani hover:bg-ink transition-colors duration-[250ms] px-8 py-3.5 text-sm tracking-[0.1em] font-bold uppercase flex items-center justify-center gap-2 w-full sm:w-auto">
              SHOP NOW <span className="font-mono font-normal">↗</span>
            </Link>
            <Link href="/about" className="border border-ink text-ink font-rajdhani hover:bg-ink hover:text-paper transition-colors duration-[250ms] px-8 py-3.5 text-sm tracking-[0.1em] font-bold uppercase flex items-center justify-center w-full sm:w-auto">
              OUR STORY
            </Link>
          </div>
        </motion.div>
        
        {/* Right Column */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 2.2 }}
          className="w-full md:w-[55%] relative flex flex-row gap-3 md:gap-6 p-4 md:p-6 md:pl-0 min-h-[60vh] md:min-h-0 md:h-[calc(100dvh-108px)] md:mt-0"
        >
          {/* Photo 1 (Staggered smaller) */}
          <div className="w-[40%] md:w-[45%] h-[75%] mt-auto bg-linen relative flex items-center justify-center border border-stone/10 overflow-hidden">
            <Image 
              src="/details.png" 
              alt="Detail Photograph" 
              fill 
              className="object-cover" 
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 40vw, 45vw"
              priority
            />
          </div>

          {/* Photo 2 (Full height) */}
          <div className="w-[60%] md:w-[55%] h-full bg-stone relative flex items-center justify-center overflow-hidden">
            <Image 
              src="/model.png" 
              alt="Model Photograph" 
              fill 
              className="object-cover" 
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 60vw, 55vw"
              priority
            />
          </div>
          
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 2.5 }}
            className="absolute bottom-10 right-6 md:left-[45%] md:-translate-x-1/2 md:right-auto z-30"
          >
            <Link href="/product/korean-pants" className="bg-terracotta text-white rounded-full px-6 py-2.5 font-rajdhani font-bold flex items-center justify-center hover:scale-[1.04] hover:-translate-y-[2px] hover:shadow-[0_4px_14px_rgba(192,78,24,0.28)] hover:bg-ink cursor-pointer transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] shadow-sm whitespace-nowrap text-[0.85rem] tracking-wider">
              KOREAN PANTS &nbsp;&nbsp;₹2,000 <span className="font-mono font-normal ml-1">↗</span>
            </Link>
          </motion.div>
        </motion.div>
        </div>
        
        {/* SECTION 3: TICKER STRIP (Moved inside Hero) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
          className="w-full bg-ink overflow-hidden h-[44px] flex items-center border-y border-ink shrink-0"
        >
          <div className="flex whitespace-nowrap ticker-animation font-rajdhani text-[0.85rem] font-bold uppercase tracking-[0.25em] text-paper">
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR ·</span>
            <span className="px-4">LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR · LIMITED STOCK · NO RESTOCKS · FIT WITH NO LOGO · शहरी · KOREAN PANTS · LINEN PANTS · DELHI NCR ·</span>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: THE DROP */}
      <FadeInSection className="py-16 md:py-20 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <h2 className="font-bebas text-ink text-5xl md:text-[6rem] leading-[0.85] pt-2">THE DROP</h2>
          <div className="font-mono text-[0.8rem] text-ink/70 md:mb-3">
            {loading ? 'Loading styles...' : `${products.length} style${products.length === 1 ? '' : 's'}. All limited. None coming back.`}
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

      {/* SECTION 5: BRAND MANIFESTO */}
      <section className="bg-ink w-full">
        <FadeInSection className="max-w-[1400px] mx-auto py-32 md:py-40 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div className="flex flex-col w-full">
            <h2 className="font-bebas text-paper text-[5rem] md:text-[6rem] lg:text-[7rem] leading-[0.9] mb-12 md:mb-16 uppercase break-words pt-2">
              BUILT<br/>FOR THE<br/>STREET.<br/>NOT FOR<br/>THE FEED.
            </h2>
            <div className="w-full h-px bg-temple-gold opacity-50"></div>
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

      {/* SECTION 6: BRAND STORY */}
      <section className="bg-paper w-full overflow-hidden">
        <FadeInSection className="py-24 md:py-40 max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[60%_40%] items-center gap-12 lg:gap-0">
          <div className="px-6 md:pl-12 lg:pl-24 mb-6 lg:mb-0">
            <div className="aspect-[16/9] bg-stone flex items-center justify-center w-full relative border border-stone/20 overflow-hidden">
              <Image 
                src="/group.png" 
                alt="Editorial Photograph" 
                fill 
                className="object-cover" 
                referrerPolicy="no-referrer"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
            <div className="font-mono text-ink/70 text-[0.75rem] mt-6 lg:ml-12 lg:mr-0 pl-4 lg:pl-0 border-l border-stone/30 lg:border-none">
              Street. Not store.
            </div>
          </div>
          
          <div className="px-6 md:px-12 lg:px-20 xl:px-24 flex flex-col justify-center">
            <h2 className="font-bebas text-ink text-6xl md:text-[5rem] leading-[0.9] mb-10 pt-2">WHY ONLY BOTTOMS?</h2>
            <div className="font-mono text-[0.9rem] text-ink/70 leading-[1.8] mb-12 whitespace-pre-line tracking-tight">
{`Because nobody talks about them.
Tops get the collab. Tops get the hype.

The bottom half is where fit lives.
Where structure shows.
Where silhouette speaks.

We started there.
We're staying there.`}
            </div>
            <div className="self-start">
              <button className="border border-ink font-rajdhani text-ink text-[0.85rem] font-bold px-8 py-3.5 uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors duration-300 flex items-center justify-center">
                READ THE FULL STORY <span className="font-mono font-normal ml-2 text-xs">↗</span>
              </button>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* SECTION 7: KOREAN ACCENT LABEL */}
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
            © 2025 The Shehri Co. · Delhi NCR · All drops are final.
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
            <a href="#" className="font-mono text-[0.75rem] text-stone/70 underline decoration-stone/40 underline-offset-4 hover:text-paper hover:decoration-paper transition-colors w-fit mt-1">
              Instagram ↗
            </a>
          </div>
          
          <div className="flex flex-col justify-start md:items-center">
            <div className="flex flex-col gap-3 font-rajdhani text-[0.85rem] font-bold uppercase text-stone/70 tracking-[0.2em] leading-loose">
              <Link href="/shop" className="hover:text-paper transition-colors w-fit">SHOP</Link>
              <Link href="/about" className="hover:text-paper transition-colors w-fit">ABOUT</Link>
              <a href="mailto:hello@theshehrico.in" className="hover:text-paper transition-colors w-fit">CONTACT</a>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 md:items-end text-left md:text-right mt-4 md:mt-0">
            <div className="font-mono text-[0.75rem] text-stone/70 mb-2">
              No restocks. No discounts.
            </div>
            <div className="font-rajdhani text-[0.8rem] font-bold text-stone/70">
              Returns: DM us.
            </div>
            <a href="mailto:hello@theshehrico.in" className="font-rajdhani text-[0.8rem] font-bold text-stone/70 hover:text-paper transition-colors">
              hello@theshehrico.in
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
