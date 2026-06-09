import type { SupabaseClient } from '@supabase/supabase-js';

const NUMERIC_ORDER_PATTERN = /^SHR-(\d+)$/;

function formatOrderNumber(n: number): string {
  return `SHR-${String(n).padStart(4, '0')}`;
}

function maxNumericOrderNumber(orderNumbers: string[]): number {
  let max = 0;
  for (const orderNumber of orderNumbers) {
    const match = orderNumber.match(NUMERIC_ORDER_PATTERN);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max;
}

/** Next sequential order number: SHR-0001, SHR-0002, … */
export async function generateOrderNumber(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number');
  if (!error && typeof data === 'string' && data.length > 0) {
    return data;
  }

  // Fallback if RPC unavailable — scan existing numeric SHR-#### numbers
  const { data: rows } = await supabase.from('orders').select('order_number').like('order_number', 'SHR-%');
  return formatOrderNumber(maxNumericOrderNumber((rows ?? []).map((r) => r.order_number)) + 1);
}

export function isDuplicateOrderNumberError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; details?: string };
  const mentionsOrderNumber =
    e.message?.includes('orders_order_number_key') ||
    e.details?.includes('order_number') ||
    e.message?.includes('order_number');

  return e.code === '23505' && Boolean(mentionsOrderNumber);
}
