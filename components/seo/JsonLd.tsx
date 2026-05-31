import {
  organizationSchema,
  productGroupSchema,
  websiteSchema,
  faqSchema,
  breadcrumbSchema,
} from '@/lib/seo/json-ld';

const schemas = [
  organizationSchema,
  productGroupSchema,
  websiteSchema,
  faqSchema,
  breadcrumbSchema,
];

export function JsonLd() {
  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema['@type'] as string}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
