import type { Metadata } from 'next';
import {
  Bebas_Neue,
  Rajdhani,
  IBM_Plex_Mono,
  Noto_Sans_KR,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { PostHogProvider } from '@/providers/PostHogProvider';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const rajdhani = Rajdhani({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
});

const notoSansKR = Noto_Sans_KR({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  weight: ['400', '700'],
  subsets: ['devanagari'],
  variable: '--font-noto-sans-devanagari',
});

export const metadata: Metadata = {
  title: 'The Shehri Co. | Fit With No Logo',
  description: "India's first bottoms-only streetwear label. Limited drops. No restocks. Delhi NCR.",
  openGraph: {
    title: 'The Shehri Co. | Fit With No Logo',
    description: "India's first bottoms-only streetwear label.",
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    bebasNeue.variable,
    rajdhani.variable,
    ibmPlexMono.variable,
    notoSansKR.variable,
    notoSansDevanagari.variable,
  ].join(' ');

  return (
    <html lang="en" className={`${fontVars} antialiased`}>
      <body suppressHydrationWarning>
        <PostHogProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
