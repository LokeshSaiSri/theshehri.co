'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface Variant {
  id: string; size: string; color: string; sku: string; stock: number; reserved: number;
}

interface Product {
  id: string; name: string; slug: string; price: number; description: string;
  images: string[]; fabric_info: string; fit_notes: string; is_active: boolean;
  drop_id: string | null;
  variants: Variant[];
}

const DEFAULT_PRODUCT: Product = {
  id: 'new', name: '', slug: '', price: 0, description: '', images: [],
  fabric_info: '', fit_notes: '', is_active: true, drop_id: null, variants: []
};

export default function AdminProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [product, setProduct] = useState<Product>(DEFAULT_PRODUCT);
  const [imagesText, setImagesText] = useState('');
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [colorsInput, setColorsInput] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [availableDrops, setAvailableDrops] = useState<any[]>([]);
  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

  useEffect(() => {
    // Fetch drops for the selector
    fetch('/api/admin/drops').then(r => r.json()).then(d => setAvailableDrops(d || []));

    if (id !== 'new') {
      fetch(`/api/admin/products/${id}`).then(r => r.json()).then(d => {
        setProduct({ ...DEFAULT_PRODUCT, ...d });
        setImagesText((d.images || []).join('\n'));
        
        const cSet = new Set<string>();
        const sSet = new Set<string>();
        (d.variants || []).forEach((v: Variant) => {
          if (v.color) cSet.add(v.color);
          if (v.size) sSet.add(v.size);
        });
        setColorsInput(Array.from(cSet).join(', '));
        setSizes(Array.from(sSet));
        
        setLoading(false);
      });
    }
  }, [id]);

  async function save() {
    setSaving(true);
    
    const payload = {
      ...product,
      images: imagesText.split('\n').map(s => s.trim()).filter(Boolean)
    };

    const res = await fetch(`/api/admin/products/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      router.push('/admin/products');
    } else {
      alert('Failed to save product');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/products');
    else { alert('Failed to delete product'); setSaving(false); }
  }

  function updateVariant(idx: number, field: keyof Variant, value: any) {
    const newVariants = [...product.variants];
    newVariants[idx] = { ...newVariants[idx], [field]: value };
    setProduct(p => ({ ...p, variants: newVariants }));
  }

  function toggleSize(sz: string) {
    setSizes(prev => prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]);
  }

  function handleDropChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const dropId = e.target.value || null;
    if (!dropId) {
      setProduct({ ...product, drop_id: null });
      return;
    }

    const drop = availableDrops.find(d => d.id === dropId);
    if (drop) {
      setProduct(p => ({
        ...p,
        drop_id: dropId,
        name: p.name || drop.name,
        slug: p.slug || drop.slug,
        description: p.description || drop.description
      }));
      if (drop.cover_image && !imagesText.includes(drop.cover_image)) {
        setImagesText(prev => prev.trim() ? `${prev}\n${drop.cover_image}` : drop.cover_image);
      }
    } else {
      setProduct({ ...product, drop_id: dropId });
    }
  }

  function generateCombinations() {
    const cList = colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    const colors = cList.length > 0 ? cList : ['']; // Default to one empty color if none specified
    
    if (sizes.length === 0 && colors.length === 0) {
      alert('Please select at least one size or color');
      return;
    }
    
    const newVariants: Variant[] = [];
    
    for (const color of colors) {
      for (const size of sizes) {
        const existing = product.variants.find(v => v.size === size && (v.color || '') === color);
        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            id: `new_${Math.random().toString(36).slice(2)}`,
            size, color, sku: `${product.slug ? product.slug.substring(0,3).toUpperCase() : 'PRD'}-${color ? color.substring(0,3).toUpperCase()+'-' : ''}${size}`, stock: 0, reserved: 0
          });
        }
      }
    }
    
    setProduct(p => ({ ...p, variants: newVariants }));
  }

  function removeVariant(idx: number) {
    const newVariants = [...product.variants];
    newVariants.splice(idx, 1);
    setProduct(p => ({ ...p, variants: newVariants }));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;

  return (
    <div className="space-y-6 max-w-[1000px] pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="flex items-center gap-1.5 font-mono text-[0.72rem] text-ink/50 hover:text-ink">
            <ArrowLeft size={13} /> Back
          </Link>
          <h1 className="font-bebas text-[#191714] text-3xl tracking-wide">{id === 'new' ? 'New Product' : 'Edit Product'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {id !== 'new' && (
            <button onClick={handleDelete} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors bg-terracotta text-white hover:bg-[#a84015] disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving</> : <><Save size={14} />Save Product</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider">General Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Name</label>
                <input value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Slug</label>
                <input value={product.slug} onChange={e => setProduct({...product, slug: e.target.value})} placeholder="black-trouser" className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
              </div>
            </div>

            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Price (₹)</label>
              <input type="number" value={product.price} onChange={e => setProduct({...product, price: parseInt(e.target.value) || 0})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
            </div>

            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Description</label>
              <textarea value={product.description} onChange={e => setProduct({...product, description: e.target.value})} rows={4} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Fabric Info</label>
                <textarea value={product.fabric_info} onChange={e => setProduct({...product, fabric_info: e.target.value})} rows={3} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none" />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Fit Notes</label>
                <textarea value={product.fit_notes} onChange={e => setProduct({...product, fit_notes: e.target.value})} rows={3} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-5">
            <div>
              <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-1">Variant Generator</h2>
              <p className="font-mono text-[0.68rem] text-ink/50 mb-4">Define your options to automatically generate a matrix of variants.</p>
              
              <div className="space-y-4 bg-[#F9FAFB] p-4 border border-[#E5E7EB] rounded-lg">
                <div>
                  <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-2 block">Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_SIZES.map(sz => (
                      <button 
                        key={sz} 
                        onClick={() => toggleSize(sz)}
                        className={`px-3 py-1.5 font-mono text-[0.7rem] rounded border transition-colors ${sizes.includes(sz) ? 'bg-terracotta text-white border-terracotta' : 'bg-white border-[#E5E7EB] text-ink/60 hover:border-gray-300'}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-2 block">Colors (Comma separated)</label>
                  <input 
                    value={colorsInput} 
                    onChange={e => setColorsInput(e.target.value)} 
                    placeholder="e.g. Black, Navy, Olive" 
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" 
                  />
                </div>

                <button onClick={generateCombinations} className="w-full bg-ink text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase py-2.5 rounded hover:bg-ink/90 transition-colors">
                  Generate Variant Matrix
                </button>
              </div>
            </div>

            {product.variants.length > 0 && (
              <div>
                <h3 className="font-rajdhani font-bold text-[#191714] text-xs uppercase tracking-wider mb-3">Generated Variants</h3>
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50">Variant</th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50">SKU</th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50 w-24">Stock</th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50 w-20">Reserved</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {product.variants.map((variant, idx) => (
                        <tr key={variant.id} className="bg-white hover:bg-[#F9FAFB]/50">
                          <td className="px-3 py-2">
                            <span className="font-rajdhani font-bold text-[#191714] uppercase text-[0.85rem]">
                              {variant.color ? `${variant.color} · ` : ''}{variant.size}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <input value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-terracotta/40 px-1 py-1 font-mono text-[0.75rem] focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={variant.stock} onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value)||0)} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1 font-mono text-[0.75rem] focus:outline-none focus:border-terracotta/40" />
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-[0.75rem] text-ink/50 px-2">{variant.reserved}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Status & Drops</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${product.is_active ? 'left-6' : 'left-1'}`} />
                </div>
                <span className="font-mono text-[0.75rem] text-ink/70 uppercase tracking-widest">{product.is_active ? 'Active' : 'Draft'}</span>
              </label>

              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Assign to Drop</label>
                <select 
                  value={product.drop_id || ''} 
                  onChange={handleDropChange}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.75rem] focus:outline-none focus:border-terracotta/40"
                >
                  <option value="">-- No Drop (Standard Product) --</option>
                  {availableDrops.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({new Date(d.launch_date).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider">Images</h2>
              <label className="cursor-pointer bg-terracotta text-white px-3 py-1.5 rounded text-[0.65rem] font-bold uppercase tracking-widest hover:bg-[#a84015] transition-colors">
                <span className="flex items-center gap-1.5">
                  <Plus size={12} /> Upload Image
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const uploadBtn = e.target.previousElementSibling as HTMLElement;
                    const originalText = uploadBtn.innerText;
                    uploadBtn.innerText = 'UPLOADING...';
                    
                    try {
                      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      if (data.url) {
                        setImagesText(prev => prev.trim() ? prev + '\n' + data.url : data.url);
                      } else {
                        alert(data.error || 'Upload failed');
                      }
                    } catch (err) {
                      alert('Error uploading file');
                    } finally {
                      uploadBtn.innerText = originalText;
                      e.target.value = ''; // Reset input
                    }
                  }}
                />
              </label>
            </div>
            <p className="font-mono text-[0.62rem] text-ink/50 mb-3">Paste one image URL per line or upload files. First image is the thumbnail.</p>
            <textarea value={imagesText} onChange={e => setImagesText(e.target.value)} rows={6} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.7rem] focus:outline-none focus:border-terracotta/40 whitespace-pre" placeholder="https://..." />
            
            {imagesText.trim() && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {imagesText.split('\n').filter(Boolean).map((img, i) => (
                  <div key={i} className="aspect-[3/4] bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-[0.55rem] font-mono px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
