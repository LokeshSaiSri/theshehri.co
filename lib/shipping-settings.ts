import { createServerClient } from '@/lib/supabase/server';

export type ShippingSettings = {
  shipping_rate: number;
  free_shipping_above: number;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shipping_rate: 199,
  free_shipping_above: 2000,
};

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('settings')
      .select('shipping_rate, free_shipping_above')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return DEFAULT_SHIPPING_SETTINGS;

    return {
      shipping_rate: data.shipping_rate ?? DEFAULT_SHIPPING_SETTINGS.shipping_rate,
      free_shipping_above: data.free_shipping_above ?? DEFAULT_SHIPPING_SETTINGS.free_shipping_above,
    };
  } catch {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}
