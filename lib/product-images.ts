import type { Product } from './products';

export type ColorImages = Record<string, string[]>;

export function parseColorList(input: string): string[] {
  return input
    .split(',')
    .map((color) => color.trim())
    .filter(Boolean);
}

export function getImagesForColor(
  product: Pick<Product, 'images' | 'color_images'>,
  color?: string | null,
): string[] {
  if (color && product.color_images?.[color]?.length) {
    return product.color_images[color];
  }

  if (product.images?.length) {
    return product.images;
  }

  if (product.color_images) {
    const first = Object.values(product.color_images).find((images) => images.length > 0);
    if (first) return first;
  }

  return [];
}

export function getThumbnailForColor(
  product: Pick<Product, 'images' | 'color_images'>,
  color?: string | null,
): string {
  return getImagesForColor(product, color)[0] || '';
}

export function deriveLegacyImages(colorImages: ColorImages, colors: string[]): string[] {
  for (const color of colors) {
    if (colorImages[color]?.length) return colorImages[color];
  }

  const first = Object.values(colorImages).find((images) => images.length > 0);
  return first || [];
}

export function normalizeColorImages(
  colorImages: ColorImages | null | undefined,
  colors: string[],
): ColorImages {
  const normalized: ColorImages = {};

  for (const color of colors) {
    normalized[color] = colorImages?.[color] || [];
  }

  return normalized;
}

export function pruneVariantsForOptions<T extends { size: string; color?: string | null }>(
  variants: T[],
  colors: string[],
  sizes: string[],
): T[] {
  return variants.filter((variant) => {
    if (colors.length > 0 && !colors.includes(variant.color || '')) return false;
    if (sizes.length > 0 && !sizes.includes(variant.size)) return false;
    return true;
  });
}
