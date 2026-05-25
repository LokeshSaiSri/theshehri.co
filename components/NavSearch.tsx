'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X } from 'lucide-react';
import { getAllProducts, type Product } from '@/lib/products';

export default function NavSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (products.length === 0) {
        setLoading(true);
        getAllProducts()
          .then(setProducts)
          .finally(() => setLoading(false));
      }
    } else {
      setTimeout(() => setQuery(''), 300);
    }
  }, [isOpen, products.length]);

  const filteredProducts = query.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.slug.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <motion.div 
        initial={false}
        animate={{ width: isOpen ? '220px' : '0px', opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden flex items-center border-b border-ink/20 mr-2"
        style={{ originX: 1 }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent outline-none font-rajdhani text-sm uppercase tracking-wider text-ink py-1 px-2 placeholder:text-ink/40"
        />
        <button 
          onClick={() => { setIsOpen(false); setQuery(''); }} 
          className="p-1 text-ink/40 hover:text-ink transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </motion.div>

      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="hover:text-terracotta transition-colors shrink-0"
      >
        <SearchIcon size={18} strokeWidth={1.5} />
      </button>

      {/* Dropdown Results Overlay */}
      <AnimatePresence>
        {isOpen && query.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-[calc(100%+20px)] right-0 w-[300px] md:w-[400px] bg-paper border border-stone/20 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100] flex flex-col max-h-[60vh] overflow-hidden"
          >
            <div className="p-4 border-b border-stone/10 bg-linen/50 font-mono text-[0.65rem] tracking-widest text-ink/50 uppercase">
              {loading ? 'Searching...' : `${filteredProducts.length} Results`}
            </div>
            
            <div className="overflow-y-auto p-4 flex flex-col gap-4">
              {filteredProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-16 aspect-[4/5] bg-linen relative overflow-hidden shrink-0">
                    {product.images[0] && (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-rajdhani text-sm font-bold uppercase tracking-[0.1em] text-ink group-hover:text-terracotta transition-colors">
                      {product.name}
                    </div>
                    <div className="font-mono text-[0.7rem] text-ink/70 mt-1">
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </Link>
              ))}
              
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center font-mono text-[0.75rem] text-ink/50 py-8">
                  No matches found for "{query}".
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
