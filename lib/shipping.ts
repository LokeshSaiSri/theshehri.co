export type ShippingConfig = {
  shippingRate: number;
  freeShippingAbove: number;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  shippingRate: 199,
  freeShippingAbove: 2000,
};

export function calculateShipping(
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  return subtotal >= config.freeShippingAbove ? 0 : config.shippingRate;
}

export function calculateTotal(
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  return subtotal + calculateShipping(subtotal, config);
}

export function isEligibleForFreeShipping(
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): boolean {
  return subtotal >= config.freeShippingAbove;
}

export function amountUntilFreeShipping(
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  return Math.max(0, config.freeShippingAbove - subtotal);
}

export function settingsToConfig(settings: {
  shipping_rate: number;
  free_shipping_above: number;
}): ShippingConfig {
  return {
    shippingRate: settings.shipping_rate,
    freeShippingAbove: settings.free_shipping_above,
  };
}
