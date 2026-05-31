import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Size Guide',
  description:
    'Shehri Co. size guide — waist and length measurements for Korean pants and baggy linen pants India. Wide leg pants India fit notes.',
};

const KOREAN = [
  { size: 'S', waist: '71–76 cm', length: '102 cm' },
  { size: 'M', waist: '76–81 cm', length: '104 cm' },
  { size: 'L', waist: '81–86 cm', length: '106 cm' },
  { size: 'XL', waist: '86–91 cm', length: '108 cm' },
];

const LINEN = [
  { size: 'S', waist: '74–79 cm', length: '100 cm' },
  { size: 'M', waist: '79–84 cm', length: '102 cm' },
  { size: 'L', waist: '84–89 cm', length: '104 cm' },
  { size: 'XL', waist: '89–94 cm', length: '106 cm' },
];

export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-paper text-ink px-6 md:px-12 py-24 max-w-3xl mx-auto">
      <h1 className="font-bebas text-4xl md:text-5xl mb-4">Korean Pants Size Guide</h1>
      <p className="font-mono text-sm text-ink/70 mb-10 leading-relaxed">
        Wide leg pants India sizing for Batch 001. Linen trousers India run generous — size down if between sizes.
      </p>

      <section className="mb-12" aria-labelledby="korean-size-heading">
        <h2 id="korean-size-heading" className="font-rajdhani font-bold uppercase tracking-widest text-lg mb-4">
          Korean Pants
        </h2>
        <table className="w-full font-mono text-sm border border-stone">
          <thead>
            <tr className="border-b border-stone bg-linen">
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Waist</th>
              <th className="p-3 text-left">Length</th>
            </tr>
          </thead>
          <tbody>
            {KOREAN.map((row) => (
              <tr key={row.size} className="border-b border-stone/30">
                <td className="p-3">{row.size}</td>
                <td className="p-3">{row.waist}</td>
                <td className="p-3">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-12" aria-labelledby="linen-size-heading">
        <h2 id="linen-size-heading" className="font-rajdhani font-bold uppercase tracking-widest text-lg mb-4">
          Baggy Linen Pants
        </h2>
        <table className="w-full font-mono text-sm border border-stone">
          <thead>
            <tr className="border-b border-stone bg-linen">
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Waist</th>
              <th className="p-3 text-left">Length</th>
            </tr>
          </thead>
          <tbody>
            {LINEN.map((row) => (
              <tr key={row.size} className="border-b border-stone/30">
                <td className="p-3">{row.size}</td>
                <td className="p-3">{row.waist}</td>
                <td className="p-3">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="font-mono text-xs text-ink/60 mb-8">
        Fit &gt; Logo. Made for the bottom half. Built for the streets.
      </p>

      <Link href="/pre-launch" className="font-rajdhani font-bold uppercase tracking-widest text-terracotta hover:text-ink">
        ← Back to Batch 001 preorder
      </Link>
    </main>
  );
}
