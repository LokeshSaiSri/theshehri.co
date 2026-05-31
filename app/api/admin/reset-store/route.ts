import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const WIPE_ALL = '00000000-0000-0000-0000-000000000000';

async function clearTable(table: string) {
  const supabase = createServerClient();
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', WIPE_ALL);

  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

/**
 * Wipes transactional data (orders, customers, preorders, analytics).
 * Products, variants, stock levels, and drops are kept; reserved counts reset to 0.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { confirm } = body as { confirm?: string };

    if (confirm !== 'RESET_ALL_DATA') {
      return NextResponse.json(
        { error: 'Send { "confirm": "RESET_ALL_DATA" } to proceed' },
        { status: 400 }
      );
    }

    const password = req.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const deleted: Record<string, number> = {};

    // FK order: returns → orders (cascade order_items) → customers
    for (const table of [
      'returns',
      'orders',
      'customers',
      'preorders',
      'events',
      'waitlist',
      'alert_log',
      'stock_history',
    ]) {
      deleted[table] = await clearTable(table);
    }

    // Optional tables — ignore if missing
    for (const table of ['drop_subscribers', 'broadcasts']) {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .neq('id', WIPE_ALL);
      if (!error) deleted[table] = count ?? 0;
    }

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id');

    if (variantError) throw variantError;

    if (variants?.length) {
      const { error: resetError } = await supabase
        .from('product_variants')
        .update({ reserved: 0 })
        .neq('id', WIPE_ALL);
      if (resetError) throw resetError;
    }

    deleted.reserved_reset = variants?.length ?? 0;

    return NextResponse.json({
      success: true,
      message: 'Store transactional data cleared. Products and stock kept.',
      deleted,
    });
  } catch (error) {
    console.error('[admin/reset-store]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reset failed' },
      { status: 500 }
    );
  }
}
