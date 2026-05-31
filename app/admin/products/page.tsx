'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Save, Loader2, Check, AlertTriangle, Edit } from 'lucide-react';
import { useLiveStockPoll } from '@/lib/useLiveStockPoll';

interface Variant {
  id: string; size: string; color?: string; sku: string; stock: number; reserved: number;
}
interface Product {
  id: string; name: string; slug: string; price: number; images: string[]; variants: Variant[];
}

export default function AdminProducts() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [saving, setSaving]       = useState<Record<string, boolean>>({});
  const [saved, setSaved]         = useState<Record<string, boolean>>({});

  const applyProducts = useCallback((fresh: Product[]) => {
    setProducts((prev) => {
      setStockEdits((edits) => {
        const next = { ...edits };
        for (const p of fresh) {
          const oldProduct = prev.find((x) => x.id === p.id);
          for (const v of p.variants) {
            const oldVariant = oldProduct?.variants.find((x) => x.id === v.id);
            if (!oldVariant || edits[v.id] === oldVariant.stock) {
              next[v.id] = v.stock;
            }
          }
        }
        return next;
      });
      return fresh;
    });
  }, []);

  const refreshProducts = useCallback(async () => {
    const fresh: Product[] = await fetch('/api/admin/products', { cache: 'no-store' }).then((r) => r.json());
    applyProducts(fresh);
  }, [applyProducts]);

  useEffect(() => {
    fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()).then(d => {
      applyProducts(d);
      setLoading(false);
    });
  }, [applyProducts]);

  useLiveStockPoll(refreshProducts, 15_000);

  async function saveStock(product: Product) {
    setSaving(s => ({ ...s, [product.id]: true }));
    const variants = product.variants.map(v => ({ id: v.id, stock: stockEdits[v.id] ?? v.stock }));
    await fetch(`/api/admin/products/${product.id}/stock`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants }),
    });
    setSaving(s => ({ ...s, [product.id]: false }));
    setSaved(s => ({ ...s, [product.id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [product.id]: false })), 2500);
    await refreshProducts();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Products & Stock</h1>
          <p className="font-mono text-gray-400 text-[0.72rem] mt-0.5">Edit stock quantities per size</p>
        </div>
        <Link href="/admin/products/new" className="bg-terracotta text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-[#a84015] transition-colors">
          + Add Product
        </Link>
      </div>

      {products.map(product => {
        const totalStock     = product.variants.reduce((s, v) => s + v.stock, 0);
        const totalReserved  = product.variants.reduce((s, v) => s + v.reserved, 0);
        const totalAvailable = totalStock - totalReserved;
        const hasAlert       = product.variants.some(v => v.stock - v.reserved <= 3);
        const productEdited  = product.variants.some(v => stockEdits[v.id] !== undefined && stockEdits[v.id] !== v.stock);

        return (
          <div key={product.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-4">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.name} className="w-14 h-14 object-cover rounded-lg" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bebas text-[#191714] text-2xl tracking-wide">{product.name}</h2>
                    {hasAlert && <AlertTriangle size={15} className="text-orange-400" />}
                  </div>
                  <p className="font-mono text-ink/80 text-[0.68rem]">
                    ₹{product.price.toLocaleString('en-IN')} · {totalAvailable} available of {totalStock} total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase rounded-lg transition-colors bg-[#F3F4F6] text-ink/70 hover:bg-[#E5E7EB]"
                >
                  <Edit size={13} /> Edit Details
                </Link>
                <button
                  onClick={() => saveStock(product)}
                  disabled={!productEdited || saving[product.id]}
                  className={`flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase rounded-lg transition-colors ${
                    saved[product.id] ? 'bg-green-600 text-white'
                    : productEdited   ? 'bg-terracotta text-white hover:bg-[#a84015]'
                                      : 'bg-[#F3F4F6] text-ink/40 cursor-not-allowed'
                  }`}
                >
                  {saving[product.id] ? <><Loader2 size={13} className="animate-spin" />Saving</>
                   : saved[product.id] ? <><Check size={13} />Saved</>
                   : <><Save size={13} />Save Stock</>}
                </button>
              </div>
            </div>

            {/* Variants grid */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.variants.map(variant => {
                  const current   = stockEdits[variant.id] ?? variant.stock;
                  const available = current - variant.reserved;
                  const isLow     = available <= 3;
                  const isOut     = available <= 0;

                  return (
                    <div key={variant.id} className={`p-4 rounded-xl border-2 ${isOut ? 'border-red-200 bg-red-50' : isLow ? 'border-orange-200 bg-orange-50' : 'border-[#E5E7EB] bg-[#FFFFFF]'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-bebas text-2xl text-[#191714]">{variant.size}</span>
                          {variant.color && <span className="font-rajdhani font-bold text-[0.8rem] text-ink/80 ml-2 uppercase tracking-wide">{variant.color}</span>}
                        </div>
                        <span className={`font-mono text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                          isOut ? 'bg-red-100 text-red-600' : isLow ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                        }`}>{isOut ? 'OUT' : isLow ? `${available} left` : 'OK'}</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="font-mono text-[0.58rem] uppercase tracking-wider text-ink/80 block mb-1">Stock</label>
                          <input
                            type="number" min={0} value={current}
                            onChange={e => setStockEdits(ed => ({ ...ed, [variant.id]: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 font-mono text-[0.85rem] text-[#191714] focus:outline-none focus:border-terracotta/60 text-center"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="font-mono text-[0.55rem] text-ink/80 uppercase">Reserved</p>
                            <p className="font-mono text-[0.78rem] text-[#191714]">{variant.reserved}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[0.55rem] text-ink/80 uppercase">Available</p>
                            <p className={`font-mono text-[0.78rem] font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-green-600'}`}>{available}</p>
                          </div>
                        </div>
                        <p className="font-mono text-[0.58rem] text-ink/80 text-center">{variant.sku}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
