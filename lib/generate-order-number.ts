import type { SupabaseClient } from '@supabase/supabase-js';

/** Next sequential order number: SHR-001, SHR-002, … */
export async function generateOrderNumber(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number');
  if (!error && typeof data === 'string' && data.length > 0) {
    return data;
  }

  // Fallback if RPC unavailable
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const next = (count ?? 0) + 1;
  return `SHR-${String(next).padStart(3, '0')}`;
}
