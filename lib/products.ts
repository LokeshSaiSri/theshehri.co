import { supabase } from './supabase/client';

export type Size = 'S' | 'M' | 'L' | 'XL';

export interface ProductVariant {
  id: string;
  product_id: string;
  size: Size;
  color?: string;
  stock: number;
  reserved: number;
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  fabric_info: string;
  fit_notes: string;
  is_active: boolean;
  drop_id?: string | null;
  drop?: {
    id: string;
    name: string;
    launch_date: string;
    is_active: boolean;
  } | null;
  variants: ProductVariant[];
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch product');
    const data = await res.json();
    return data as Product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

export function getAvailableStock(variant: ProductVariant): number {
  return Math.max(0, variant.stock - variant.reserved);
}

export function isSoldOut(variants: ProductVariant[]): boolean {
  return variants.every((v) => getAvailableStock(v) === 0);
}

export function isVariantAvailable(variant: ProductVariant): boolean {
  return getAvailableStock(variant) > 0;
}
