-- Allow all sizes selectable in admin (was S/M/L/XL only).
ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_size_check;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_size_check
  CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'));
