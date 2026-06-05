import { deriveLegacyImages, type ColorImages } from './product-images';

export interface EditorVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  reserved: number;
}

export interface EditorColor {
  id: string;
  name: string;
  images: string[];
}

export interface ProductEditorData {
  colors: EditorColor[];
  sizes: string[];
  variants: EditorVariant[];
  fallbackImages: string[];
}

interface LoadedProduct {
  slug: string;
  images?: string[];
  color_images?: ColorImages | null;
  variants?: EditorVariant[];
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function createColorId(): string {
  return `color_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSku(slug: string, color: string, size: string): string {
  const prefix = slug ? slug.substring(0, 3).toUpperCase() : 'PRD';
  const colorPart = color ? `${color.substring(0, 3).toUpperCase()}-` : '';
  return `${prefix}-${colorPart}${size}`;
}

export function initProductEditor(product: LoadedProduct): ProductEditorData {
  const colorNames = new Set<string>();

  for (const variant of product.variants || []) {
    const name = normalizeName(variant.color || '');
    if (name) colorNames.add(name);
  }

  for (const name of Object.keys(product.color_images || {})) {
    const normalized = normalizeName(name);
    if (normalized) colorNames.add(normalized);
  }

  const colors: EditorColor[] = Array.from(colorNames).map((name) => ({
    id: createColorId(),
    name,
    images: product.color_images?.[name] || [],
  }));

  const sizes = Array.from(
    new Set((product.variants || []).map((variant) => variant.size).filter(Boolean)),
  );

  const hasColorImages = Object.keys(product.color_images || {}).length > 0;

  return {
    colors,
    sizes,
    variants: product.variants || [],
    fallbackImages: hasColorImages ? [] : product.images || [],
  };
}

export function addColor(
  data: ProductEditorData,
  rawName: string,
  slug = '',
): ProductEditorData {
  const name = normalizeName(rawName);
  if (!name) return data;

  const exists = data.colors.some((c) => c.name.toLowerCase() === name.toLowerCase());
  if (exists) return data;

  const next: ProductEditorData = {
    ...data,
    colors: [...data.colors, { id: createColorId(), name, images: [] }],
  };

  return rebuildVariants(next, slug);
}

export function removeColor(data: ProductEditorData, colorId: string): ProductEditorData {
  const removed = data.colors.find((c) => c.id === colorId);
  if (!removed) return data;

  const next: ProductEditorData = {
    ...data,
    colors: data.colors.filter((c) => c.id !== colorId),
    variants: data.variants.filter((v) => v.color !== removed.name),
  };

  return next;
}

export function renameColor(data: ProductEditorData, colorId: string, rawName: string): ProductEditorData {
  const name = normalizeName(rawName);
  if (!name) return data;

  const current = data.colors.find((c) => c.id === colorId);
  if (!current || current.name === name) return data;

  const duplicate = data.colors.some(
    (c) => c.id !== colorId && c.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) return data;

  const colors = data.colors.map((c) => (c.id === colorId ? { ...c, name } : c));
  const variants = data.variants.map((v) =>
    v.color === current.name ? { ...v, color: name } : v,
  );

  return { colors, sizes: data.sizes, variants, fallbackImages: data.fallbackImages };
}

export function setColorImages(data: ProductEditorData, colorId: string, images: string[]): ProductEditorData {
  return {
    ...data,
    colors: data.colors.map((c) => (c.id === colorId ? { ...c, images } : c)),
  };
}

export function toggleSize(data: ProductEditorData, size: string, slug: string): ProductEditorData {
  const sizes = data.sizes.includes(size)
    ? data.sizes.filter((s) => s !== size)
    : [...data.sizes, size];

  return rebuildVariants({ ...data, sizes }, slug);
}

export function rebuildVariants(data: ProductEditorData, slug: string): ProductEditorData {
  if (data.sizes.length === 0) {
    return { ...data, variants: [] };
  }

  const variants: EditorVariant[] = [];
  const colorRows = data.colors.length > 0 ? data.colors : [{ id: 'default', name: '', images: [] }];

  for (const color of colorRows) {
    for (const size of data.sizes) {
      const existing = data.variants.find(
        (v) => v.size === size && (v.color || '') === (color.name || ''),
      );

      if (existing) {
        variants.push(existing);
      } else {
        variants.push({
          id: `new_${Math.random().toString(36).slice(2)}`,
          size,
          color: color.name,
          sku: buildSku(slug, color.name, size),
          stock: 0,
          reserved: 0,
        });
      }
    }
  }

  return { ...data, variants };
}

export function updateVariant(
  data: ProductEditorData,
  variantId: string,
  field: keyof EditorVariant,
  value: string | number,
): ProductEditorData {
  return {
    ...data,
    variants: data.variants.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)),
  };
}

export function removeVariant(data: ProductEditorData, variantId: string): ProductEditorData {
  return {
    ...data,
    variants: data.variants.filter((v) => v.id !== variantId),
  };
}

export function serializeProductEditor(data: ProductEditorData) {
  const colorNames = data.colors.map((c) => c.name);
  const color_images: ColorImages = {};

  for (const color of data.colors) {
    color_images[color.name] = color.images;
  }

  const images =
    data.colors.length > 0
      ? deriveLegacyImages(color_images, colorNames)
      : data.fallbackImages;

  const allowedColors = new Set(colorNames);
  const allowedSizes = new Set(data.sizes);

  const variants = data.variants.filter((variant) => {
    if (data.sizes.length > 0 && !allowedSizes.has(variant.size)) return false;
    if (data.colors.length > 0 && !allowedColors.has(variant.color || '')) return false;
    return true;
  });

  return {
    images,
    color_images: data.colors.length > 0 ? color_images : {},
    variants,
    colorNames,
  };
}
