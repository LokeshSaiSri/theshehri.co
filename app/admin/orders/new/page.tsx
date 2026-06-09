'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { AdminToast } from '@/components/admin/AdminToast';
import { sortVariants } from '@/lib/sizes';
import { calculateShipping, settingsToConfig } from '@/lib/shipping';

type ProductVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  reserved: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  variants: ProductVariant[];
};

type CartLine = {
  key: string;
  productId: string;
  productName: string;
  size: string;
  color: string | null;
  listPrice: number;
  price: number;
  quantity: number;
};

type FulfillmentOption =
  | 'stall_pickup'
  | 'instagram_speed_post'
  | 'instagram_collecting';

const FULFILLMENT_OPTIONS: { value: FulfillmentOption; label: string }[] = [
  { value: 'stall_pickup', label: 'Stall pickup' },
  { value: 'instagram_speed_post', label: 'Instagram referral — deliver via Speed Post' },
  { value: 'instagram_collecting', label: 'Instagram referral — customer collecting' },
];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 mb-1.5 block">
      {children}
    </label>
  );
}

const inputCls =
  'w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.78rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/50';

export default function NewManualOrderPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [shippingSettings, setShippingSettings] = useState({ shipping_rate: 199, free_shipping_above: 2000 });
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Delhi');
  const [address, setAddress] = useState('');

  // Item builder
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [amountReceived, setAmountReceived] = useState<number | ''>('');

  // Fulfillment
  const [fulfillment, setFulfillment] = useState<FulfillmentOption>('stall_pickup');
  const [shipName, setShipName] = useState('');
  const [shipAddress, setShipAddress] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipPincode, setShipPincode] = useState('');
  const [sourceNote, setSourceNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active !== false),
    [products]
  );

  const selectedProduct = activeProducts.find((p) => p.id === selectedProductId);

  const sizeOptions = useMemo(() => {
    if (!selectedProduct) return [];
    const sizes = Array.from(new Set(selectedProduct.variants.map((v) => v.size)));
    return sizes.sort();
  }, [selectedProduct]);

  const colorOptions = useMemo(() => {
    if (!selectedProduct || !selectedSize) return [];
    const colors = selectedProduct.variants
      .filter((v) => v.size === selectedSize)
      .map((v) => v.color)
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(colors));
  }, [selectedProduct, selectedSize]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/shipping-settings').then((r) => r.json()),
    ]).then(([prods, ship]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      if (ship?.shipping_rate != null) setShippingSettings(ship);
      setLoadingProducts(false);
    });
  }, []);

  const fetchStock = useCallback(async () => {
    if (!selectedProductId || !selectedSize) {
      setAvailableStock(null);
      return;
    }
    setStockLoading(true);
    const params = new URLSearchParams({
      productId: selectedProductId,
      size: selectedSize,
    });
    if (selectedColor) params.set('color', selectedColor);
    const res = await fetch(`/api/admin/orders/variant-stock?${params}`);
    const data = await res.json();
    setAvailableStock(data.available ?? 0);
    setStockLoading(false);
  }, [selectedProductId, selectedSize, selectedColor]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    setSelectedSize('');
    setSelectedColor(null);
    setQuantity(1);
    setUnitPrice(selectedProduct?.price ?? '');
  }, [selectedProductId, selectedProduct?.price]);

  useEffect(() => {
    setSelectedColor(colorOptions.length === 1 ? colorOptions[0] : null);
  }, [selectedSize, colorOptions]);

  const listSubtotal = cart.reduce((s, i) => s + i.listPrice * i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemSavings = Math.max(0, listSubtotal - subtotal);
  const shippingConfig = settingsToConfig(shippingSettings);
  const shipping =
    fulfillment === 'instagram_speed_post'
      ? calculateShipping(subtotal, shippingConfig)
      : 0;
  const orderDiscount = discount === '' ? 0 : Math.max(0, discount);
  const calculatedTotal = Math.max(0, subtotal + shipping - orderDiscount);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      setAmountReceived(calculatedTotal);
    }
  }, [calculatedTotal, paymentStatus]);

  function updateLinePrice(key: string, price: number) {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, price: Math.max(0, price) } : i)),
    );
  }

  function addItem() {
    if (!selectedProduct || !selectedSize) return;
    if (availableStock !== null && availableStock < quantity) return;

    const salePrice =
      unitPrice === '' ? selectedProduct.price : Math.max(0, Number(unitPrice));

    const variant = sortVariants(
      selectedProduct.variants.filter(
        (v) =>
          v.size === selectedSize &&
          (colorOptions.length === 0 || v.color === selectedColor || (!v.color && !selectedColor))
      )
    )[0];

    const color = selectedColor ?? variant?.color ?? null;
    const key = `${selectedProduct.id}-${selectedSize}-${color ?? ''}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          size: selectedSize,
          color,
          listPrice: selectedProduct.price,
          price: salePrice,
          quantity,
        },
      ];
    });

    setQuantity(1);
    setTimeout(fetchStock, 100);
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setToast({ message: 'Name and phone are required', variant: 'error' });
      return;
    }
    if (!email.trim()) {
      setToast({ message: 'Email is required — receipt is sent automatically', variant: 'error' });
      return;
    }
    if (cart.length === 0) {
      setToast({ message: 'Add at least one item', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone, email: email.trim(), city, address: address || undefined },
          items: cart.map(({ productId, productName, size, color, price, quantity: qty }) => ({
            productId,
            productName,
            size,
            color,
            price,
            quantity: qty,
          })),
          paymentMethod,
          paymentStatus,
          discount: orderDiscount,
          amountReceived: amountReceived === '' ? calculatedTotal : Number(amountReceived),
          fulfillment,
          shippingAddress:
            fulfillment === 'instagram_speed_post'
              ? {
                  name: shipName || name,
                  address_line1: shipAddress,
                  city: shipCity || city,
                  pincode: shipPincode,
                  state: 'Delhi',
                }
              : undefined,
          sourceNote: sourceNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.error ?? 'Failed to create order', variant: 'error' });
        return;
      }

      let message = `Order #${data.orderNumber} created`;
      if (data.emailSent) {
        message += ` · receipt sent to ${email.trim()}`;
      } else if (data.emailError) {
        message += ` · receipt email failed: ${data.emailError}`;
      }
      setToast({
        message,
        variant: data.emailSent ? 'success' : 'error',
      });
      setTimeout(() => router.push(`/admin/orders/${data.orderId}`), 1500);
    } catch {
      setToast({ message: 'Something went wrong — try again', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const canAddItem =
    selectedProduct &&
    selectedSize &&
    quantity >= 1 &&
    (availableStock === null || availableStock >= quantity) &&
    (colorOptions.length === 0 || selectedColor !== null || colorOptions.length === 1);

  return (
    <div className="max-w-[1400px] space-y-6">
      {toast && (
        <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1.5 font-mono text-[0.72rem] text-ink/80 hover:text-ink"
        >
          <ArrowLeft size={13} /> Orders
        </Link>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">New Manual Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-5">
            {/* Section 1 — Customer */}
            <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
              <h2 className="font-rajdhani font-bold text-sm uppercase tracking-wider text-[#191714]">
                Customer details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Full name *</FieldLabel>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Rahul Singh" />
                </div>
                <div>
                  <FieldLabel>Phone *</FieldLabel>
                  <input required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputCls} placeholder="9810123456" inputMode="numeric" />
                </div>
                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="customer@email.com"
                  />
                  <p className="font-mono text-[0.58rem] text-ink/55 mt-1.5">
                    Receipt is emailed automatically, same as website orders.
                  </p>
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <FieldLabel>Full address</FieldLabel>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="Optional — not needed for stall pickups" />
              </div>
            </section>

            {/* Section 2 — Items */}
            <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
              <h2 className="font-rajdhani font-bold text-sm uppercase tracking-wider text-[#191714]">
                Order items
              </h2>
              {loadingProducts ? (
                <p className="font-mono text-[0.75rem] text-ink/60">Loading products…</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FieldLabel>Product</FieldLabel>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select product…</option>
                        {activeProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {fmt(p.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Size</FieldLabel>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        disabled={!selectedProductId}
                        className={inputCls}
                      >
                        <option value="">Select size…</option>
                        {sizeOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    {colorOptions.length > 0 && (
                      <div>
                        <FieldLabel>Color</FieldLabel>
                        <select
                          value={selectedColor ?? ''}
                          onChange={(e) => setSelectedColor(e.target.value || null)}
                          disabled={!selectedSize}
                          className={inputCls}
                        >
                          <option value="">Select color…</option>
                          {colorOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <FieldLabel>Quantity</FieldLabel>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel>Sale price (per unit)</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={unitPrice}
                        onChange={(e) =>
                          setUnitPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                        }
                        disabled={!selectedProduct}
                        className={inputCls}
                        placeholder={selectedProduct ? String(selectedProduct.price) : '—'}
                      />
                      {selectedProduct && unitPrice !== '' && Number(unitPrice) < selectedProduct.price && (
                        <p className="font-mono text-[0.62rem] text-terracotta mt-1">
                          {fmt(selectedProduct.price - Number(unitPrice))} off list price
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedSize && (
                    <p className="font-mono text-[0.72rem] text-ink/60">
                      {stockLoading ? (
                        'Checking stock…'
                      ) : availableStock === 0 ? (
                        <span className="text-red-600">Out of stock</span>
                      ) : availableStock !== null ? (
                        <>{availableStock} available</>
                      ) : null}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!canAddItem}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#191714] text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase rounded-lg hover:bg-terracotta disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} /> Add item
                  </button>
                </>
              )}
            </section>

            {/* Section 3 — Payment */}
            <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
              <h2 className="font-rajdhani font-bold text-sm uppercase tracking-wider text-[#191714]">
                Payment
              </h2>
              <div>
                <FieldLabel>Payment method</FieldLabel>
                <div className="flex gap-4">
                  {(['cash', 'upi'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 font-mono text-[0.78rem] cursor-pointer">
                      <input type="radio" name="paymentMethod" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                      {m.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Payment status</FieldLabel>
                <div className="flex gap-4">
                  {(['paid', 'pending'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 font-mono text-[0.78rem] cursor-pointer">
                      <input type="radio" name="paymentStatus" checked={paymentStatus === s} onChange={() => setPaymentStatus(s)} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Order discount (₹)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={subtotal + shipping}
                  value={discount}
                  onChange={(e) =>
                    setDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                  }
                  className={inputCls}
                />
                <p className="font-mono text-[0.65rem] text-ink/50 mt-1">
                  Extra off the whole order — stall deals, Instagram offers, etc.
                </p>
              </div>
              <div>
                <FieldLabel>Amount received</FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={paymentStatus === 'paid'}
                  className={`${inputCls} disabled:opacity-60`}
                />
                <p className="font-mono text-[0.65rem] text-ink/50 mt-1">
                  {paymentStatus === 'paid'
                    ? 'Matches total after discount'
                    : 'Edit for partial payment on pending orders'}
                </p>
              </div>
            </section>

            {/* Section 4 — Fulfillment */}
            <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
              <h2 className="font-rajdhani font-bold text-sm uppercase tracking-wider text-[#191714]">
                Fulfillment
              </h2>
              <div className="space-y-2">
                {FULFILLMENT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-start gap-2 font-mono text-[0.75rem] cursor-pointer">
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={fulfillment === opt.value}
                      onChange={() => setFulfillment(opt.value)}
                      className="mt-0.5"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {fulfillment === 'instagram_speed_post' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F3F4F6]">
                  <div>
                    <FieldLabel>Recipient name</FieldLabel>
                    <input value={shipName} onChange={(e) => setShipName(e.target.value)} className={inputCls} placeholder={name || 'Same as customer'} />
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <input value={shipCity} onChange={(e) => setShipCity(e.target.value)} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Address *</FieldLabel>
                    <input required={fulfillment === 'instagram_speed_post'} value={shipAddress} onChange={(e) => setShipAddress(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel>PIN code *</FieldLabel>
                    <input required={fulfillment === 'instagram_speed_post'} value={shipPincode} onChange={(e) => setShipPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls} inputMode="numeric" />
                  </div>
                </div>
              )}

              <div>
                <FieldLabel>Source note (internal)</FieldLabel>
                <input
                  value={sourceNote}
                  onChange={(e) => setSourceNote(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Stall at Shahpur Jat, 14 Dec"
                />
              </div>
            </section>
          </div>

          {/* Order summary panel */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h2 className="font-rajdhani font-bold text-sm uppercase tracking-wider text-[#191714] mb-4">
                Order summary
              </h2>

              {cart.length === 0 ? (
                <p className="font-mono text-[0.72rem] text-ink/50 py-6 text-center">No items yet</p>
              ) : (
                <ul className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <li key={item.key} className="flex gap-2 items-start border-b border-[#F9FAFB] pb-3 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-rajdhani font-bold text-[0.8rem] uppercase truncate">{item.productName}</p>
                        <p className="font-mono text-[0.65rem] text-ink/60">
                          {item.color ? `${item.color} · ` : ''}Size {item.size} · Qty {item.quantity}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[0.62rem] text-ink/50">₹/unit</span>
                          <input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => updateLinePrice(item.key, Number(e.target.value))}
                            className="w-20 bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1 font-mono text-[0.68rem]"
                          />
                          {item.price < item.listPrice && (
                            <span className="font-mono text-[0.6rem] text-ink/40 line-through">
                              {fmt(item.listPrice)}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[0.72rem] text-ink/80 mt-1">{fmt(item.price * item.quantity)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-ink/40 hover:text-red-600 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                {itemSavings > 0 && (
                  <div className="flex justify-between font-mono text-[0.72rem]">
                    <span className="text-ink/50">List subtotal</span>
                    <span className="text-ink/50 line-through">{fmt(listSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-[0.75rem]">
                  <span className="text-ink/60">Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {itemSavings > 0 && (
                  <div className="flex justify-between font-mono text-[0.72rem] text-terracotta">
                    <span>Item savings</span>
                    <span>−{fmt(itemSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-[0.75rem]">
                  <span className="text-ink/60">Shipping</span>
                  <span>
                    {fulfillment === 'stall_pickup' || fulfillment === 'instagram_collecting'
                      ? '₹0 (Free — Pickup)'
                      : shipping === 0
                        ? '₹0 (Free shipping)'
                        : fmt(shipping)}
                  </span>
                </div>
                {orderDiscount > 0 && (
                  <div className="flex justify-between font-mono text-[0.75rem] text-terracotta">
                    <span>Discount</span>
                    <span>−{fmt(orderDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-rajdhani font-bold text-[0.85rem] pt-2 border-t border-[#E5E7EB]">
                  <span>Total</span>
                  <span className="text-terracotta">{fmt(calculatedTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full mt-5 py-3 bg-terracotta text-white font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg hover:bg-[#a84015] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Creating…
                  </>
                ) : (
                  'Create order'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
