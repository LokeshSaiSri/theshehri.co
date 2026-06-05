'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2, X } from 'lucide-react';
import { uploadAdminImage } from '@/lib/admin-image-upload';
import {
  addColor,
  initProductEditor,
  removeColor,
  removeVariant,
  rebuildVariants,
  serializeProductEditor,
  setColorImages,
  toggleSize,
  updateVariant,
  type ProductEditorData,
} from '@/lib/product-editor';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  color_images?: Record<string, string[]>;
  fabric_info: string;
  fit_notes: string;
  is_active: boolean;
  drop_id: string | null;
}

const DEFAULT_PRODUCT: Product = {
  id: 'new',
  name: '',
  slug: '',
  price: 0,
  description: '',
  images: [],
  fabric_info: '',
  fit_notes: '',
  is_active: true,
  drop_id: null,
};

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export default function AdminProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product>(DEFAULT_PRODUCT);
  const [editor, setEditor] = useState<ProductEditorData>({
    colors: [],
    sizes: [],
    variants: [],
    fallbackImages: [],
  });
  const [newColorName, setNewColorName] = useState('');
  const [uploadingColorId, setUploadingColorId] = useState<string | null>(null);
  const [fallbackUploading, setFallbackUploading] = useState(false);
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [availableDrops, setAvailableDrops] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/drops')
      .then((r) => r.json())
      .then((d) => setAvailableDrops(d || []));

    if (id !== 'new') {
      fetch(`/api/admin/products/${id}`)
        .then((r) => r.json())
        .then((d) => {
          setProduct({ ...DEFAULT_PRODUCT, ...d, variants: undefined } as Product);
          setEditor(
            initProductEditor({
              slug: d.slug || '',
              images: d.images || [],
              color_images: d.color_images,
              variants: d.variants || [],
            }),
          );
          setLoading(false);
        });
    }
  }, [id]);

  async function save() {
    setSaving(true);

    const serialized = serializeProductEditor(editor);
    const payload = {
      ...product,
      images: serialized.images,
      color_images: serialized.color_images,
      variants: serialized.variants,
    };

    const res = await fetch('/api/admin/products/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/admin/products');
      return;
    }

    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Failed to save product');
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/products');
    else {
      alert('Failed to delete product');
      setSaving(false);
    }
  }

  function handleAddColor() {
    const trimmed = newColorName.trim();
    if (!trimmed) return;

    const duplicate = editor.colors.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      alert('That color already exists.');
      return;
    }

    setEditor((prev) => addColor(prev, trimmed, product.slug));
    setNewColorName('');
  }

  function handleRemoveColor(colorId: string) {
    const color = editor.colors.find((c) => c.id === colorId);
    if (!color) return;

    const variantCount = editor.variants.filter((v) => v.color === color.name).length;
    const message =
      variantCount > 0
        ? `Remove "${color.name}" and its ${variantCount} variant(s) and images?`
        : `Remove "${color.name}" and its images?`;

    if (!confirm(message)) return;
    setEditor((prev) => removeColor(prev, colorId));
  }

  function handleToggleSize(size: string) {
    setEditor((prev) => toggleSize(prev, size, product.slug));
  }

  function handleSyncVariants() {
    setEditor((prev) => rebuildVariants(prev, product.slug));
  }

  async function handleColorImageUpload(colorId: string, file: File) {
    setUploadingColorId(colorId);
    try {
      const url = await uploadAdminImage(file);
      const color = editor.colors.find((c) => c.id === colorId);
      if (!color) return;
      setEditor((prev) =>
        setColorImages(prev, colorId, [...(color.images || []), url]),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setUploadingColorId(null);
    }
  }

  function handleDropChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const dropId = e.target.value || null;
    if (!dropId) {
      setProduct({ ...product, drop_id: null });
      return;
    }

    const drop = availableDrops.find((d) => d.id === dropId);
    if (drop) {
      setProduct((p) => ({
        ...p,
        drop_id: dropId,
        name: p.name || drop.name,
        slug: p.slug || drop.slug,
        description: p.description || drop.description,
      }));

      if (drop.cover_image && editor.colors.length === 0) {
        const urls = editor.fallbackImages;
        if (!urls.includes(drop.cover_image)) {
          setEditor((prev) => ({
            ...prev,
            fallbackImages: [...urls, drop.cover_image],
          }));
        }
      }
    } else {
      setProduct({ ...product, drop_id: dropId });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  const hasColors = editor.colors.length > 0;

  return (
    <div className="space-y-6 max-w-[1000px] pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 font-mono text-[0.72rem] text-ink/50 hover:text-ink"
          >
            <ArrowLeft size={13} /> Back
          </Link>
          <h1 className="font-bebas text-[#191714] text-3xl tracking-wide">
            {id === 'new' ? 'New Product' : 'Edit Product'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {id !== 'new' && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors bg-terracotta text-white hover:bg-[#a84015] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save size={14} />
                Save Product
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider">
              General Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                  Name
                </label>
                <input
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40"
                />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                  Slug
                </label>
                <input
                  value={product.slug}
                  onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                  placeholder="black-trouser"
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                Price (₹)
              </label>
              <input
                type="number"
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40"
              />
            </div>

            <div>
              <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                Description
              </label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                rows={4}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                  Fabric Info
                </label>
                <textarea
                  value={product.fabric_info}
                  onChange={(e) => setProduct({ ...product, fabric_info: e.target.value })}
                  rows={3}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none"
                />
              </div>
              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                  Fit Notes
                </label>
                <textarea
                  value={product.fit_notes}
                  onChange={(e) => setProduct({ ...product, fit_notes: e.target.value })}
                  rows={3}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-5">
            <div>
              <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-1">
                Colors & Sizes
              </h2>
              <p className="font-mono text-[0.68rem] text-ink/50 mb-4">
                Add colors individually. Removing a color deletes its variants and images immediately.
              </p>

              <div className="space-y-4 bg-[#F9FAFB] p-4 border border-[#E5E7EB] rounded-lg">
                <div>
                  <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-2 block">
                    Sizes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1.5 font-mono text-[0.7rem] rounded border transition-colors ${
                          editor.sizes.includes(sz)
                            ? 'bg-terracotta text-white border-terracotta'
                            : 'bg-white border-[#E5E7EB] text-ink/60 hover:border-gray-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-2 block">
                    Colors
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddColor();
                        }
                      }}
                      placeholder="e.g. Black"
                      className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-ink text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase rounded-lg hover:bg-ink/90 transition-colors"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {editor.colors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {editor.colors.map((color) => (
                        <div
                          key={color.id}
                          className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shadow-inner shrink-0"
                            style={{ backgroundColor: color.name.toLowerCase().replace(/ /g, '') }}
                          />
                          <span className="font-rajdhani font-bold text-[0.8rem] uppercase tracking-wide text-[#191714]">
                            {color.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Remove ${color.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-mono text-[0.62rem] text-ink/40">
                      No colors yet. Add at least one color for color-specific images and variants.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSyncVariants}
                  disabled={editor.sizes.length === 0}
                  className="w-full bg-ink text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase py-2.5 rounded hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sync Variant Matrix
                </button>
              </div>
            </div>

            {editor.variants.length > 0 && (
              <div>
                <h3 className="font-rajdhani font-bold text-[#191714] text-xs uppercase tracking-wider mb-3">
                  Variants ({editor.variants.length})
                </h3>
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50">
                          Variant
                        </th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50">
                          SKU
                        </th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50 w-24">
                          Stock
                        </th>
                        <th className="px-3 py-2 font-mono text-[0.55rem] uppercase text-ink/50 w-20">
                          Reserved
                        </th>
                        <th className="px-3 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {editor.variants.map((variant) => (
                        <tr key={variant.id} className="bg-white hover:bg-[#F9FAFB]/50">
                          <td className="px-3 py-2">
                            <span className="font-rajdhani font-bold text-[#191714] uppercase text-[0.85rem]">
                              {variant.color ? `${variant.color} · ` : ''}
                              {variant.size}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={variant.sku}
                              onChange={(e) =>
                                setEditor((prev) =>
                                  updateVariant(prev, variant.id, 'sku', e.target.value),
                                )
                              }
                              className="w-full bg-transparent border-b border-transparent focus:border-terracotta/40 px-1 py-1 font-mono text-[0.75rem] focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(e) =>
                                setEditor((prev) =>
                                  updateVariant(
                                    prev,
                                    variant.id,
                                    'stock',
                                    parseInt(e.target.value, 10) || 0,
                                  ),
                                )
                              }
                              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1 font-mono text-[0.75rem] focus:outline-none focus:border-terracotta/40"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-[0.75rem] text-ink/50 px-2">
                              {variant.reserved}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setEditor((prev) => removeVariant(prev, variant.id))
                              }
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                            >
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
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">
              Status & Drops
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    product.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
                      product.is_active ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
                <span className="font-mono text-[0.75rem] text-ink/70 uppercase tracking-widest">
                  {product.is_active ? 'Active' : 'Draft'}
                </span>
              </label>

              <div>
                <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">
                  Assign to Drop
                </label>
                <select
                  value={product.drop_id || ''}
                  onChange={handleDropChange}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.75rem] focus:outline-none focus:border-terracotta/40"
                >
                  <option value="">-- No Drop (Standard Product) --</option>
                  {availableDrops.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({new Date(d.launch_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-2">
              Images
            </h2>

            {hasColors ? (
              <div className="space-y-5">
                <p className="font-mono text-[0.62rem] text-ink/50">
                  Each color has its own image set. Shoppers only see photos for the color they pick.
                </p>

                {editor.colors.map((color) => {
                  const isUploading = uploadingColorId === color.id;

                  return (
                    <div
                      key={color.id}
                      className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F9FAFB]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner"
                            style={{ backgroundColor: color.name.toLowerCase().replace(/ /g, '') }}
                          />
                          <h3 className="font-rajdhani font-bold text-[#191714] text-xs uppercase tracking-wider">
                            {color.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <label
                            className={`cursor-pointer bg-terracotta text-white px-3 py-1.5 rounded text-[0.65rem] font-bold uppercase tracking-widest hover:bg-[#a84015] transition-colors ${
                              isUploading ? 'opacity-70 pointer-events-none' : ''
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isUploading ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Plus size={12} />
                              )}
                              {isUploading ? 'Uploading...' : 'Upload'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await handleColorImageUpload(color.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Remove ${color.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={color.images.join('\n')}
                        onChange={(e) =>
                          setEditor((prev) =>
                            setColorImages(
                              prev,
                              color.id,
                              e.target.value
                                .split('\n')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            ),
                          )
                        }
                        rows={4}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.7rem] focus:outline-none focus:border-terracotta/40 whitespace-pre"
                        placeholder="https://..."
                      />

                      {color.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {color.images.map((img, i) => (
                            <div
                              key={`${color.id}-${i}`}
                              className="aspect-[3/4] bg-white rounded-lg overflow-hidden border border-[#E5E7EB] relative"
                            >
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
                  );
                })}
              </div>
            ) : (
              <>
                <p className="font-mono text-[0.62rem] text-ink/50 mb-3">
                  No colors defined — using a single shared image list. Add colors above for per-color
                  galleries.
                </p>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className={`cursor-pointer bg-terracotta text-white px-3 py-1.5 rounded text-[0.65rem] font-bold uppercase tracking-widest hover:bg-[#a84015] transition-colors ${
                      fallbackUploading ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {fallbackUploading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      {fallbackUploading ? 'Uploading...' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={fallbackUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setFallbackUploading(true);
                        try {
                          const url = await uploadAdminImage(file);
                          setEditor((prev) => ({
                            ...prev,
                            fallbackImages: [...prev.fallbackImages, url],
                          }));
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Error uploading file');
                        } finally {
                          setFallbackUploading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={editor.fallbackImages.join('\n')}
                  onChange={(e) =>
                    setEditor((prev) => ({
                      ...prev,
                      fallbackImages: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  rows={6}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.7rem] focus:outline-none focus:border-terracotta/40 whitespace-pre"
                  placeholder="https://..."
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
