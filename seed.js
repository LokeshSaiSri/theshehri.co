import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 3);

  // 1. Create drop
  const dropRes = await fetch(`${SUPABASE_URL}/rest/v1/drops`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Summer Drop',
      launch_date: launchDate.toISOString(),
      is_active: true
    })
  });
  const drops = await dropRes.json();
  console.log('Drop:', drops);
  
  if (!drops || drops.length === 0) return;
  const dropId = drops[0].id;

  // 2. Create product
  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      slug: 'oversized-cuban-shirt',
      name: 'Oversized Cuban Shirt',
      price: 1800,
      description: 'Breezy, lightweight summer essential with an oversized fit.',
      fabric_info: '100% Linen',
      fit_notes: 'Oversized fit. Go true to size.',
      images: ['https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?q=80&w=800&auto=format&fit=crop'],
      is_active: true,
      drop_id: dropId
    })
  });
  const prods = await prodRes.json();
  console.log('Product:', prods);
}
run();
