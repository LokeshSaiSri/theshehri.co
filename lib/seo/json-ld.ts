import { SITE_URL } from '@/lib/seo/site-metadata';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Shehri Co.',
  alternateName: 'Shehri',
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.jpg`,
  description:
    "India's first bottoms-only D2C streetwear brand. Korean pants and baggy linen pants built for urban Gen Z.",
  foundingDate: '2025',
  foundingLocation: {
    '@type': 'Place',
    name: 'New Delhi, India',
  },
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hello@theshehri.co',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: ['https://instagram.com/theshehrico', 'https://twitter.com/shehrico'],
};

export const productGroupSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProductGroup',
  name: 'Shehri Co. Batch 001 — Preorder Collection',
  description:
    "Two signature bottoms. Korean pants with a clean tailored-relaxed silhouette. Baggy linen pants in breathable natural linen. India's first bottoms-only streetwear drop.",
  url: SITE_URL,
  brand: {
    '@type': 'Brand',
    name: 'Shehri Co.',
  },
  hasVariant: [
    {
      '@type': 'Product',
      name: 'Shehri Co. Korean Pants — Batch 001',
      description:
        'Korean-inspired relaxed-fit trousers. Clean silhouette, tapered hem, side pockets. Built for the streets — not the boardroom.',
      image: [`${SITE_URL}/model.png`, `${SITE_URL}/details.png`],
      sku: 'SKU-KOREAN-001',
      material: 'Cotton Blend',
      color: 'Black',
      size: ['S', 'M', 'L', 'XL'],
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/product/korean-pants`,
        priceCurrency: 'INR',
        price: '2000',
        priceValidUntil: '2026-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/PreOrder',
        deliveryLeadTime: {
          '@type': 'QuantitativeValue',
          minValue: 18,
          maxValue: 21,
          unitCode: 'DAY',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: '0',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            name: 'Delhi NCR',
          },
        },
        seller: {
          '@type': 'Organization',
          name: 'Shehri Co.',
        },
      },
    },
    {
      '@type': 'Product',
      name: 'Shehri Co. Baggy Linen Pants — Batch 001',
      description:
        'Oversized baggy fit in 100% natural linen. Breathable, relaxed, and built for the Delhi summer. Wears like a mood, not a uniform.',
      image: [`${SITE_URL}/model2.png`, `${SITE_URL}/details.png`],
      sku: 'SKU-LINEN-001',
      material: '100% Linen',
      color: 'Natural / Off-White',
      size: ['S', 'M', 'L', 'XL'],
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/product/linen-pants`,
        priceCurrency: 'INR',
        price: '1500',
        priceValidUntil: '2026-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/PreOrder',
        deliveryLeadTime: {
          '@type': 'QuantitativeValue',
          minValue: 18,
          maxValue: 21,
          unitCode: 'DAY',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: '0',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            name: 'Delhi NCR',
          },
        },
        seller: {
          '@type': 'Organization',
          name: 'Shehri Co.',
        },
      },
    },
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: SITE_URL,
  name: 'Shehri Co.',
  description: "India's first bottoms-only streetwear brand",
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Shehri Co.?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Shehri Co. is India's first bottoms-only D2C streetwear brand. We make Korean pants and baggy linen pants — premium bottoms built for Indian streets, starting with Delhi.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is a Korean pant?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Korean pants are trousers inspired by Korean streetwear fashion — characterized by a relaxed but tailored silhouette, clean lines, slightly tapered hem, and a fit that looks intentional without trying too hard. Shehri Co.'s version is made for Indian sizing and summers.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between Korean pants and baggy linen pants?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Korean pants have a structured, clean silhouette — relaxed but shaped. Baggy linen pants are fully oversized in 100% natural linen — maximum comfort, breathable for summer, a looser mood entirely. Both are from Batch 001. Best korean pants for men in India meet linen pants for summer India in one drop.',
      },
    },
    {
      '@type': 'Question',
      name: 'When will my preorder ship?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All Batch 001 preorders ship within 21 days of the preorder closing date. Delhi NCR free delivery fashion customers receive priority dispatch.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel or return my preorder?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Full refund within 7 days of placing your preorder — no questions asked. After that, we've already begun production. Post-delivery returns handled case by case at hello@theshehri.co.",
      },
    },
    {
      '@type': 'Question',
      name: 'How much does delivery cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free delivery within Delhi NCR. ₹199 flat for the rest of India. No hidden charges.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many units are available in Batch 001?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Batch 001 is a limited preorder streetwear India run across both styles. Once sold, we move to Batch 002 — different colorways, same quality. No restocks on Batch 001.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the linen pants true to size?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The baggy linen pants run one size generous by design — that is the silhouette. If you are between sizes, size down. See our Korean Pants Size Guide at theshehri.co/size-guide.',
      },
    },
  ],
};

export const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
  ],
};
