import type { Metadata } from 'next';
import { SEO_DESCRIPTION, SEO_TITLE, SITE_URL } from '@/lib/seo/site-metadata';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: 'Shehri Co. — Korean Pants & Linen Bottoms for Indian Streets',
    description: SEO_DESCRIPTION,
  },
};

export default function PreLaunchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
