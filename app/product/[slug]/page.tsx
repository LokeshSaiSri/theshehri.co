'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, ArrowLeft, ChevronDown, X, Check } from 'lucide-react';
import { getProductBySlug, getAvailableStock, type Product, type ProductVariant } from '@/lib/products';
import { useCart, type CartItem } from '@/context/CartContext';
import { track } from '@/lib/track';
import { notFound } from 'next/navigation';
import NavSearch from '@/components/NavSearch';

// ─── Navbar ────────────────────────────────────────────────────────────────

function NavBar() {
  const { itemCount } = useCart();
  return (
    <nav className="fixed top-0 left-0 w-full bg-paper border-b border-stone z-50 flex items-center justify-between px-6 md:px-12 h-16">
      <Link href="/" className="flex flex-row items-baseline gap-1 font-bebas text-ink text-xl pt-1">
        <span className="tracking-wide text-[1.2rem]">THE</span>
        <span className="font-devanagari text-terracotta text-[1.2rem]">शहरी</span>
        <span className="tracking-wide text-[1.2rem]">CO.</span>
      </Link>
      <div className="hidden md:flex font-rajdhani text-xs uppercase tracking-[0.2em] text-ink gap-8 items-center">
        <Link href="/shop" className="relative group">
          SHOP<span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
        </Link>
        <Link href="/about" className="relative group">
          ABOUT<span className="absolute bottom-[-4px] left-0 w-0 h-px bg-terracotta transition-all duration-300 group-hover:w-full" />
        </Link>
      </div>
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

// ─── Size Guide Modal ───────────────────────────────────────────────────────

const SIZE_GUIDE = {
  'Korean Pants': [
    { size: 'S',  waist: '28–30"', hip: '36–38"', length: '40"' },
    { size: 'M',  waist: '30–32"', hip: '38–40"', length: '40.5"' },
    { size: 'L',  waist: '32–34"', hip: '40–42"', length: '41"' },
    { size: 'XL', waist: '34–36"', hip: '42–44"', length: '41.5"' },
  ],
  'Linen Pants': [
    { size: 'S',  waist: '28–30"', hip: '36–38"', length: '39"' },
    { size: 'M',  waist: '30–32"', hip: '38–40"', length: '39.5"' },
    { size: 'L',  waist: '32–34"', hip: '40–42"', length: '40"' },
    { size: 'XL', waist: '34–36"', hip: '42–44"', length: '40.5"' },
  ],
};

function SizeGuideModal({ productName, onClose }: { productName: string; onClose: () => void }) {
  const guide = SIZE_GUIDE[productName as keyof typeof SIZE_GUIDE] || SIZE_GUIDE['Korean Pants'];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/70 z-[200] flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-paper w-full max-w-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="font-bebas text-ink text-3xl tracking-wide">SIZE GUIDE</h2>
              <p className="font-mono text-ink/70 text-[0.7rem] mt-1">{productName}</p>
            </div>
            <button onClick={onClose} className="text-ink/70 hover:text-ink transition-colors"><X size={20} /></button>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone/30">
                {['Size', 'Waist', 'Hip', 'Length'].map((h) => (
                  <th key={h} className="font-rajdhani text-[0.75rem] font-bold uppercase tracking-widest text-ink/70 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.map((row) => (
                <tr key={row.size} className="border-b border-stone/10">
                  {[row.size, row.waist, row.hip, row.length].map((val, i) => (
                    <td key={i} className="font-mono text-[0.8rem] text-ink py-3 pr-4">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="font-mono text-[0.72rem] text-ink/70 mt-6 leading-relaxed">
            All measurements in inches. Korean Pants run slim — size up if between sizes.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFabric, setShowFabric] = useState(false);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Drop states
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const { addItem, items } = useCart();

  useEffect(() => {
    track('page_view', { page: `/product/${slug}`, product_slug: slug });
    track('product_view', { product_slug: slug });
    getProductBySlug(slug).then((p) => {
      if (!p) return;
      setProduct(p);
      const colors = Array.from(new Set(p.variants.map(v => v.color).filter(Boolean))) as string[];
      if (colors.length > 0) setSelectedColor(colors[0]);
      
      // Initialize countdown if drop is in future
      if (p.drop && new Date(p.drop.launch_date) > new Date()) {
        const calculateTimeLeft = () => {
          const diff = new Date(p.drop!.launch_date).getTime() - Date.now();
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
      }
      
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (!loading && !product) notFound();

  function handleSizeSelect(variant: ProductVariant) {
    const available = getAvailableStock(variant);
    if (available === 0) return;
    setSelectedSize(variant.size);
    setSizeError(false);
    track('size_selected', { product_slug: slug, size: variant.size });
  }

  function handleAddToCart() {
    if (!product) return;
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    const alreadyInCart = items.find(
      (i) => i.productId === product.id && i.size === selectedSize && i.color === selectedColor
    );
    if (alreadyInCart) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      size: selectedSize,
      color: selectedColor || undefined,
      price: product.price,
      quantity: 1,
      image: product.images[0] || '',
    };

    addItem(cartItem);
    track('add_to_cart', { product_slug: slug, size: selectedSize, color: selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const otherProducts = product ? null : null; // cross-sell placeholder

  if (loading) {
    return (
      <main className="min-h-screen bg-paper">
        <NavBar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="font-mono text-ink/70 text-sm animate-pulse">Loading...</div>
        </div>
      </main>
    );
  }

  if (!product) return null;

  const availableColors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];
  const variantsToDisplay = selectedColor 
    ? product.variants.filter((v) => v.color === selectedColor)
    : product.variants;

  const selectedVariant = variantsToDisplay.find((v) => v.size === selectedSize);
  const selectedStock = selectedVariant ? getAvailableStock(selectedVariant) : null;

  return (
    <main className="min-h-screen bg-paper selection:bg-terracotta selection:text-white">
      <NavBar />
      {showSizeGuide && <SizeGuideModal productName={product.name} onClose={() => setShowSizeGuide(false)} />}

      <div className="pt-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-10 pb-32">
          {/* Breadcrumb */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-mono text-[0.72rem] text-ink/70 hover:text-ink transition-colors mb-10 uppercase tracking-widest"
          >
            <ArrowLeft size={12} /> The Drop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* ── LEFT: Image Gallery ─────────────────────────── */}
            <div className="flex flex-col gap-4">
              {/* Main image */}
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="aspect-[3/4] relative bg-linen overflow-hidden"
              >
                {product.images[activeImage] && (
                  <Image
                    src={product.images[activeImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </motion.div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 relative bg-linen overflow-hidden border-2 transition-all duration-200 ${
                        activeImage === i ? 'border-terracotta' : 'border-transparent hover:border-stone'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Product Info ──────────────────────────── */}
            <div className="flex flex-col lg:sticky lg:top-24">
              {/* Name + Price */}
              <div className="mb-8">
                <h1 className="font-bebas text-ink text-5xl md:text-6xl leading-[0.9] mb-3">
                  {product.name.toUpperCase()}
                </h1>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[1.4rem] text-ink">₹{product.price.toLocaleString('en-IN')}</span>
                  <span className="font-mono text-[0.75rem] text-ink/70">incl. all taxes</span>
                </div>
              </div>

              <p className="font-mono text-[0.85rem] text-ink/70 leading-[1.8] mb-8">
                {product.description}
              </p>

              <div className="w-full h-px bg-stone/20 mb-8" />

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-rajdhani text-[0.75rem] font-bold uppercase tracking-[0.2em] text-ink">
                      Select Color
                    </span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {availableColors.map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            setSelectedSize(null); // Reset size when color changes
                          }}
                          className={`flex items-center gap-2.5 px-4 py-2.5 font-rajdhani font-bold text-[0.8rem] tracking-widest border transition-all duration-200 uppercase ${
                            isSelected
                              ? 'border-ink text-ink bg-ink/5 shadow-sm'
                              : 'border-stone/50 text-ink/60 hover:border-ink/40 hover:text-ink'
                          }`}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner"
                            style={{ backgroundColor: color.toLowerCase().replace(/ /g, '') }}
                          />
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-rajdhani text-[0.75rem] font-bold uppercase tracking-[0.2em] text-ink">
                    Select Size
                  </span>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="font-mono text-[0.7rem] text-ink/70 underline underline-offset-4 decoration-stone/40 hover:text-ink hover:decoration-ink transition-colors"
                  >
                    Size Guide
                  </button>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {variantsToDisplay.map((variant) => {
                    const available = getAvailableStock(variant);
                    const isSelected = selectedSize === variant.size;
                    const soldOut = available === 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleSizeSelect(variant)}
                        disabled={soldOut}
                        className={`w-14 h-14 font-rajdhani font-bold text-sm tracking-widest border transition-all duration-200 relative ${
                          soldOut
                            ? 'border-stone/20 text-ink/70 cursor-not-allowed'
                            : isSelected
                            ? 'border-ink bg-ink text-paper'
                            : 'border-stone text-ink hover:border-ink'
                        }`}
                      >
                        {variant.size}
                        {soldOut && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-full h-px bg-stone/30 absolute rotate-[-25deg]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stock warning */}
                <AnimatePresence>
                  {selectedStock !== null && selectedStock > 0 && selectedStock <= 3 && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-[0.72rem] text-terracotta mt-3"
                    >
                      Only {selectedStock} left in {selectedSize}
                    </motion.p>
                  )}
                  {sizeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-[0.72rem] text-terracotta mt-3"
                    >
                      Please select a size first
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Drops or Add to Bag */}
              {timeLeft ? (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 mb-6">
                  <div className="text-center mb-5">
                    <span className="inline-block px-2.5 py-1 bg-terracotta text-white font-rajdhani font-bold text-[0.6rem] uppercase tracking-widest rounded mb-2">Upcoming Drop</span>
                    <h3 className="font-bebas text-2xl text-[#191714] tracking-wide mb-1">Dropping In</h3>
                    <div className="flex items-center justify-center gap-4 text-[#191714]">
                      {[
                        { l: 'Days', v: timeLeft.d },
                        { l: 'Hrs', v: timeLeft.h },
                        { l: 'Min', v: timeLeft.m },
                        { l: 'Sec', v: timeLeft.s }
                      ].map(t => (
                        <div key={t.l} className="flex flex-col items-center">
                          <span className="font-bebas text-3xl">{t.v.toString().padStart(2, '0')}</span>
                          <span className="font-mono text-[0.6rem] text-ink/60 uppercase tracking-wider">{t.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {notifySuccess ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 text-center py-3 rounded font-rajdhani font-bold text-sm">
                      You're on the list! We'll notify you.
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!notifyEmail) return;
                      setNotifyLoading(true);
                      await fetch('/api/drops/subscribe', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ drop_id: product.drop!.id, email: notifyEmail })
                      });
                      setNotifySuccess(true);
                      setNotifyLoading(false);
                    }} className="flex gap-2">
                      <input 
                        type="email" required placeholder="Enter your email"
                        value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                        className="flex-1 bg-white border border-[#E5E7EB] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-terracotta/40"
                      />
                      <button disabled={notifyLoading} className="bg-[#191714] text-white px-4 font-rajdhani font-bold text-sm tracking-wider uppercase rounded hover:bg-black disabled:opacity-50 transition-colors">
                        {notifyLoading ? '...' : 'Notify Me'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 font-rajdhani font-bold text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all duration-300 mb-4 ${
                    added
                      ? 'bg-ink text-paper'
                      : 'bg-terracotta text-white hover:bg-ink'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} strokeWidth={2} /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} /> Add to Bag
                    </>
                  )}
                </motion.button>
              )}

              {/* View Cart */}
              <AnimatePresence>
                {added && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6"
                  >
                    <Link
                      href="/cart"
                      className="w-full py-3.5 border border-ink font-rajdhani font-bold text-sm tracking-[0.15em] uppercase flex items-center justify-center hover:bg-ink hover:text-paper transition-colors duration-300"
                    >
                      View Bag ↗
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="font-mono text-[0.7rem] text-ink/70 text-center mb-8">
                No restocks. Once it&apos;s gone — it&apos;s gone.
              </p>

              <div className="w-full h-px bg-stone/20 mb-6" />

              {/* Fabric / Fit Accordion */}
              <button
                onClick={() => setShowFabric(!showFabric)}
                className="flex items-center justify-between w-full py-4 font-rajdhani font-bold text-[0.8rem] uppercase tracking-[0.15em] text-ink"
              >
                Fabric & Fit
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showFabric ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showFabric && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 space-y-4">
                      <div>
                        <p className="font-mono text-[0.72rem] text-ink/70 uppercase tracking-widest mb-1">Material</p>
                        <p className="font-mono text-[0.82rem] text-ink leading-relaxed">{product.fabric_info}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.72rem] text-ink/70 uppercase tracking-widest mb-1">Fit</p>
                        <p className="font-mono text-[0.82rem] text-ink leading-relaxed">{product.fit_notes}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-px bg-stone/20" />

              {/* Shipping note */}
              <div className="pt-6 font-mono text-[0.72rem] text-ink/70 space-y-1 leading-relaxed">
                <p>🚚 Ships within 5–7 days · Delhi NCR first</p>
                <p>📦 Flat ₹199 shipping · Free above ₹2,000</p>
                <p>↩️ Returns via DM · <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-stone/40 hover:text-ink">Instagram</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
