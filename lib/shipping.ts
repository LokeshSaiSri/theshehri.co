export const SHIPPING_RATE = 199;
export const FREE_SHIPPING_THRESHOLD = 2000;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
}

export function calculateTotal(subtotal: number): number {
  return subtotal + calculateShipping(subtotal);
}

export function isEligibleForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

export function amountUntilFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
