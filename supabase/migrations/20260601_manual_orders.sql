-- Manual order creation: source, fulfillment, payment method, internal notes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS source_note TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

-- Backfill existing rows
UPDATE orders SET source = 'online' WHERE source IS NULL;
UPDATE orders SET fulfillment_type = 'delivery' WHERE fulfillment_type IS NULL;
