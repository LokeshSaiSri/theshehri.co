'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { SITE_CONTACT } from '@/lib/site-contact';
import NavSearch from '@/components/NavSearch';

const MOBILE_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/track', label: 'Track Order' },
  { href: '/size-guide', label: 'Size Guide' },
  { href: SITE_CONTACT.instagramUrl, label: 'Instagram', external: true },
  { href: `mailto:${SITE_CONTACT.email}`, label: 'Contact' },
] as const;

export function StoreNav({ active }: { active?: 'shop' | 'about' }) {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-paper border-b border-stone z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 h-16 pt-[env(safe-area-inset-top,0px)]">
        <Link
          href="/"
          className="flex flex-row items-center gap-1 font-bebas text-ink text-xl min-h-[44px]"
        >
          <span className="tracking-wide text-[1.2rem]">THE</span>
          <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
          <span className="tracking-wide text-[1.2rem]">CO.</span>
        </Link>

        <div className="hidden md:flex font-rajdhani text-xs uppercase tracking-[0.2em] text-ink gap-8 items-center">
          <Link
            href="/shop"
            className={`relative group ${active === 'shop' ? 'text-terracotta' : ''}`}
          >
            SHOP
            <span
              className={`absolute bottom-[-4px] left-0 h-px bg-terracotta transition-all duration-300 ${
                active === 'shop' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
          <Link
            href="/about"
            className={`relative group ${active === 'about' ? 'text-terracotta' : ''}`}
          >
            ABOUT
            <span
              className={`absolute bottom-[-4px] left-0 h-px bg-terracotta transition-all duration-300 ${
                active === 'about' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-ink">
          <NavSearch />
          <Link
            href="/cart"
            className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] hover:text-terracotta transition-colors"
            aria-label={`Cart, ${itemCount} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            <span className="font-rajdhani text-xs font-semibold">({itemCount})</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] hover:text-terracotta transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

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
              className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-4 flex items-center justify-center min-h-[44px] min-w-[44px] text-ink"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
            <nav className="flex flex-col px-6 gap-1">
              {MOBILE_LINKS.map((link) =>
                'external' in link && link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="font-rajdhani font-bold text-lg uppercase tracking-[0.15em] text-ink py-3.5 min-h-[48px] flex items-center border-b border-stone/20 hover:text-terracotta"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-rajdhani font-bold text-lg uppercase tracking-[0.15em] text-ink py-3.5 min-h-[48px] flex items-center border-b border-stone/20 hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
