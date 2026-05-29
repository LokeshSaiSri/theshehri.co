# Preorder landing (`/pre-launch`)

Uses the **same design system** as the main storefront:

- Colors: `paper`, `ink`, `linen`, `stone`, `terracotta`, `temple-gold`
- Fonts: Bebas Neue, Rajdhani, IBM Plex Mono, Noto Sans Devanagari (from root `app/layout.tsx`)
- Motion: `motion/react` fade-in sections
- Patterns: ink ticker strip, Devanagari watermark, `TU. ASLI. SHEHRI. HAI.` block

## Files

- `layout.tsx` — metadata only (inherits root fonts/styles)
- `page.tsx` — full preorder experience with urgency + live inventory

## Data

- Products & stock: `/api/products`
- Drop countdown: `/api/drops/upcoming`
- Preorders: `POST /api/preorders`

## Admin

`Cmd/Ctrl + Shift + L` — admin unlock shortcut
