import { SITE_CONTACT } from '@/lib/site-contact';

import type { Metadata } from 'next';

/** Title ≤60 chars */
export const SEO_TITLE =
  'Shehri Co. | Korean Pants & Linen Bottoms India';

/** Meta description ≤155 chars */
export const SEO_DESCRIPTION =
  "India's first bottoms-only brand. Korean pants & baggy linen pants for Delhi streets. Batch 001 preorder open — limited units. Ships in 21 days.";

export const SEO_KEYWORDS = [
  'korean pants India',
  'korean trousers men India',
  'baggy linen pants India',
  'linen trousers men India',
  'streetwear India',
  'Delhi streetwear brand',
  'bottoms only brand India',
  'D2C fashion India',
  'Indian streetwear Gen Z',
  'preorder fashion India',
  'shehri co',
  'korean fashion India men',
  'wide leg pants India',
  'linen pants summer India',
];

export const SITE_URL = 'https://theshehri.co';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: '%s | Shehri Co.',
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: 'Shehri Co.', url: SITE_URL }],
  creator: 'Shehri Co.',
  publisher: 'Shehri Co.',
  category: 'fashion',
  classification: 'Streetwear / Menswear / D2C Fashion',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Shehri Co.',
    title: 'Shehri Co. — Korean Pants & Linen Bottoms for Indian Streets',
    description:
      "India's first bottoms-only streetwear brand. Korean pants and baggy linen pants — built for Delhi Gen Z. Batch 001 preorder open.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Shehri Co. Korean Pants and Baggy Linen Pants — Batch 001 Preorder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONTACT.instagramHandle,
    creator: SITE_CONTACT.instagramHandle,
    title: 'Shehri Co. | Korean Pants & Linen Bottoms — Preorder Now',
    description:
      "India's first bottoms-only streetwear. Korean pants and baggy linen pants. Batch 001 — limited units, ships in 21 days.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Domain verified in GSC via DNS TXT on Vercel — no meta tag needed.
  // verification: { google: '...' },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    'geo.region': 'IN-DL',
    'geo.placename': 'New Delhi, India',
    'geo.position': '28.6139;77.2090',
    ICBM: '28.6139, 77.2090',
  },
  manifest: '/manifest.json',
};
