import type { ProductVariant, Size } from './products';

export const SIZE_ORDER: readonly Size[] = ['S', 'M', 'L', 'XL'];

export function compareSizes(a: string, b: string): number {
  const indexA = SIZE_ORDER.indexOf(a as Size);
  const indexB = SIZE_ORDER.indexOf(b as Size);

  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a.localeCompare(b);
}

export function sortVariants<T extends { size: string; color?: string | null }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => {
    const bySize = compareSizes(a.size, b.size);
    if (bySize !== 0) return bySize;
    return (a.color || '').localeCompare(b.color || '');
  });
}

export function sortSizes(sizes: Iterable<string>): Size[] {
  return [...sizes].sort(compareSizes) as Size[];
}

export function withSortedVariants<P extends { variants?: ProductVariant[] }>(product: P): P {
  if (!product.variants?.length) return product;
  return { ...product, variants: sortVariants(product.variants) };
}

export function withSortedVariantsList<P extends { variants?: ProductVariant[] }>(products: P[]): P[] {
  return products.map(withSortedVariants);
}
