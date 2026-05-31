-- Shipping settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id                  text PRIMARY KEY DEFAULT 'default',
  shipping_rate       integer NOT NULL DEFAULT 199,
  free_shipping_above integer NOT NULL DEFAULT 2000,
  updated_at          timestamptz DEFAULT now()
);

INSERT INTO settings (id, shipping_rate, free_shipping_above)
VALUES ('default', 199, 2000)
ON CONFLICT (id) DO NOTHING;
