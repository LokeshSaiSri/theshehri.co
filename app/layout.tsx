import type { Metadata, Viewport } from 'next';
import {
  Bebas_Neue,
  Rajdhani,
  IBM_Plex_Mono,
  Noto_Sans_KR,
  Noto_Sans_Devanagari,
  Instrument_Serif,
  Syne,
} from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { PostHogProvider } from '@/providers/PostHogProvider';
import { siteMetadata } from '@/lib/seo/site-metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { AdminShortcut } from '@/components/admin/AdminShortcut';

/*
═══ SHEHRI CO. SEO LAUNCH CHECKLIST ═══

BEFORE GOING LIVE:
[ ] Add real Google Search Console token to metadata.verification.google
[ ] Replace all placeholder image paths with actual uploaded images
[ ] Verify theshehri.co domain is live and SSL is active (https only)
[ ] Test all meta tags: https://metatags.io
[ ] Test OG image renders: https://developers.facebook.com/tools/debug/
[ ] Test Twitter card: https://cards-dev.twitter.com/validator
[ ] Validate all schema: https://validator.schema.org
[ ] Test rich results eligibility: https://search.google.com/test/rich-results
[ ] PageSpeed Insights — mobile score must be 85+: https://pagespeed.web.dev
[ ] Check H1 is exactly one per page: document.querySelectorAll('h1') — must return 1
[ ] Check all product images have alt text: document.querySelectorAll('img[alt=""]') — must return 0
[ ] Confirm robots.txt is live: https://theshehri.co/robots.txt
[ ] Confirm sitemap is live: https://theshehri.co/sitemap.xml

AFTER GOING LIVE (day 1):
[ ] Submit property to Google Search Console
[ ] Submit sitemap in GSC: Indexing → Sitemaps
[ ] Request indexing for homepage in GSC
[ ] Set up Google Analytics 4
[ ] Test GSC ownership verification passes

WEEK 2 CHECK:
[ ] GSC shows theshehri.co being crawled
[ ] Core Web Vitals begin appearing (~28 days)
[ ] FAQ schema eligible in Rich Results test
[ ] Product schema showing PreOrder availability correctly
═══════════════════════════════════════
*/

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const rajdhani = Rajdhani({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  weight: ['400', '700'],
  subsets: ['devanagari'],
  variable: '--font-noto-sans-devanagari',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#191714',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    bebasNeue.variable,
    rajdhani.variable,
    ibmPlexMono.variable,
    instrumentSerif.variable,
    syne.variable,
    notoSansKR.variable,
    notoSansDevanagari.variable,
  ].join(' ');

  return (
    <html lang="en-IN" className={`${fontVars} antialiased`}>
      <head>
        <link rel="preload" as="image" href="/hero-community.png" fetchPriority="high" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .seo-hero-lcp { background-color: #191714; min-height: 100dvh; }
              .seo-hero-headline { font-size: clamp(2.5rem, 10vw, 5rem); line-height: 0.9; }
              .seo-cta { min-height: 52px; display: inline-flex; align-items: center; }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <JsonLd />
        <PostHogProvider>
          <CartProvider>
            <AdminShortcut />
            {children}
          </CartProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
