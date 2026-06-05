-- Allow variant removal when stock audit rows exist
ALTER TABLE stock_history
  DROP CONSTRAINT IF EXISTS stock_history_variant_id_fkey;

ALTER TABLE stock_history
  ADD CONSTRAINT stock_history_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Keep order lines when a variant is retired
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
