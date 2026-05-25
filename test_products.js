import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*), drop:drops(*)');
    
  if (error) console.error(error);
  console.dir(data, { depth: null });
}
run();
