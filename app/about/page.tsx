'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { StoreNav } from '@/components/StoreNav';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-paper w-full selection:bg-terracotta selection:text-white">
      <StoreNav active="about" />

      <div className="safe-nav-offset overflow-hidden">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="px-4 sm:px-6 md:px-12 pt-10 sm:pt-16 pb-10 max-w-[1300px] mx-auto relative"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[0.75rem] text-ink/70 hover:text-ink transition-colors mb-10 uppercase tracking-widest"
          >
            <ArrowLeft size={12} /> Back
          </Link>

          <div className="absolute right-2 md:right-10 top-32 md:top-24 font-devanagari text-[6rem] md:text-[10rem] text-terracotta/10 leading-none select-none pointer-events-none">
            शहरी
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-16 items-end relative z-10">
            <h1 className="font-bebas text-ink text-6xl md:text-[8.5rem] leading-[0.82] pt-2">
              ABOUT
              <br />
              SHEHRI.CO
            </h1>
            <div className="lg:mb-4">
              <p className="font-mono text-[0.78rem] text-ink/70 uppercase tracking-[0.24em] mb-4">
                Premium. Minimal. Identity-first.
              </p>
              <p className="font-mono text-[0.88rem] text-ink/80 leading-[1.8] max-w-md">
                In a logo-heavy world, we chose fit, fabric, and feel. Bottoms built for everyday movement in the modern Indian wardrobe.
              </p>
            </div>
          </div>
        </motion.section>

        <div className="w-full bg-ink overflow-hidden h-[40px] flex items-center border-y border-stone/20 mb-0">
          <div className="flex whitespace-nowrap ticker-animation font-rajdhani text-[0.75rem] font-bold uppercase tracking-[0.25em] text-paper">
            <span className="px-4">FIT &gt; LOGO · PREMIUM EVERYDAY BOTTOMS · NO LOUD BRANDING · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
            <span className="px-4">FIT &gt; LOGO · PREMIUM EVERYDAY BOTTOMS · NO LOUD BRANDING · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
            <span className="px-4">FIT &gt; LOGO · PREMIUM EVERYDAY BOTTOMS · NO LOUD BRANDING · KOREAN PANTS · LINEN PANTS · DELHI NCR · </span>
          </div>
        </div>

        <section className="px-6 md:px-12 max-w-[1300px] mx-auto pb-20 pt-14 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start"
          >
            <article className="relative border border-stone bg-paper p-6 md:p-10 md:pr-16">
              <div className="font-mono text-[0.95rem] text-ink/80 leading-[1.9] tracking-tight whitespace-pre-line">
{`At shehri.co, we believe great style should never scream for attention.

In a world obsessed with oversized logos and fast fashion, we decided to build something different - premium everyday bottoms that speak through fit, fabric, and feel instead of branding.

We are a bottoms-only menswear brand focused on crafting high-quality Korean pants and linen pants designed for the modern Indian wardrobe. Clean silhouettes, effortless comfort, and versatile fits - made for people who want to look good without trying too hard.`}
              </div>
              <div className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 font-rajdhani text-[0.72rem] font-bold tracking-[0.35em] text-terracotta uppercase">
                Fit &gt; Logo
              </div>
            </article>

            <aside className="grid gap-5">
              <div className="bg-ink text-paper p-8 md:p-10 border border-stone/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-8 font-devanagari text-[8rem] text-terracotta/20 leading-none select-none pointer-events-none">
                  शहरी
                </div>
                <h2 className="font-bebas text-4xl md:text-5xl leading-[0.9] tracking-wide mb-6 relative z-10">
                  FIT OVER HYPE.
                  <br />
                  STYLE OVER NOISE.
                </h2>
                <p className="font-mono text-[0.78rem] text-stone/80 uppercase tracking-[0.2em] relative z-10">
                  No loud branding.
                  <br />
                  No unnecessary distractions.
                  <br />
                  Just really good clothes.
                </p>
              </div>
              <div className="bg-linen border border-stone p-6 md:p-8">
                <div className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-ink/70 mb-2">Philosophy</div>
                <div className="font-bebas text-5xl md:text-6xl leading-[0.85] text-ink pt-2">FIT &gt; LOGO</div>
              </div>
            </aside>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-16 md:mt-20"
          >
            <div className="bg-ink text-paper p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="absolute right-4 bottom-2 font-bebas text-[8rem] md:text-[12rem] leading-none text-terracotta/10 pointer-events-none select-none">
                CO.
              </div>
              <div className="max-w-[900px] font-mono text-[0.95rem] text-stone/90 leading-[1.9] tracking-tight whitespace-pre-line relative z-10">
{`But shehri.co was never just about clothing.

It is for anyone who wants to feel like themselves.
People who value quality over hype.
Comfort over noise.
Personal style over trends.

Whether you are dressing up for a meeting, stepping out for coffee, heading to college, or just living your everyday life - we want our clothes to move with you effortlessly.`}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
            className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-6 border-b border-stone pb-10"
          >
            <p className="font-bebas text-5xl md:text-7xl lg:text-8xl leading-[0.82] text-ink">
              WELCOME TO
              <br />
              SHEHRI.CO.
            </p>
            <p className="font-rajdhani text-[0.8rem] font-bold uppercase tracking-[0.3em] text-terracotta md:mb-2">
              Delhi NCR - India
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[0.72rem] text-ink/70 uppercase tracking-[0.2em]"
          >
            <span>No loud branding</span>
            <span className="text-terracotta">/</span>
            <span>Quality over hype</span>
            <span className="text-terracotta">/</span>
            <span>Comfort over noise</span>
            <span className="text-terracotta">/</span>
            <span>Personal style over trends</span>
            <span className="text-terracotta">/</span>
            <span>Just really good clothes</span>
          </motion.div>
        </section>

        <section className="px-6 md:px-12 pt-6 pb-20 max-w-[1300px] mx-auto">
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="border border-stone bg-linen px-6 md:px-12 py-10 md:py-12"
          >
            <p className="font-bebas text-4xl md:text-6xl leading-[0.9] text-ink">
              Because confidence does not come from wearing someone else&apos;s name across your clothes.
            </p>
            <p className="font-mono text-[0.82rem] uppercase tracking-[0.22em] text-ink/70 mt-6">
              It comes from wearing something that genuinely feels like you.
            </p>
          </motion.blockquote>
        </section>
      </div>
    </main>
  );
}
