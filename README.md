# The Shehri Co. — Storefront

Next.js App Router D2C storefront for [theshehri.co](https://theshehri.co).

**Stack:** Next.js 15 · Supabase · Razorpay · Resend · PostHog · Tailwind CSS

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env vars — see [`.env.example`](.env.example) and fill in `.env.local`.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Admin access

Admin is hidden from public URLs. On any page, press **⌘⇧L** (Mac) or **Ctrl⇧L** (Windows), then sign in with `ADMIN_PASSWORD`.

## Database

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor for a fresh setup. Migrations live in [`supabase/migrations/`](supabase/migrations/).

## Deploy

Hosted on Vercel. Set all env vars from `.env.example` in the Vercel project settings before deploying.
