-- Fix duplicate SHR-0005 errors: use max sequential number + transaction lock (not COUNT).
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  next_num int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('shehri_order_number'));

  SELECT COALESCE(
    MAX(
      CASE
        WHEN order_number ~ '^SHR-[0-9]+$'
        THEN SUBSTRING(order_number FROM 5)::int
        ELSE 0
      END
    ),
    0
  ) + 1 INTO next_num
  FROM orders;

  RETURN 'SHR-' || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
