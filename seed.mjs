import fs from 'fs';
import path from 'path';

// read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 3);

  console.log("Creating Drop...");
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
  
  if (!drops || drops.length === 0) {
    console.log("No drop returned:", drops);
    return;
  }
  const dropId = drops[0].id;
  console.log('Drop created:', dropId);

  console.log("Creating Product...");
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
  console.log('Product created:', prods[0]?.id);
}
run();
