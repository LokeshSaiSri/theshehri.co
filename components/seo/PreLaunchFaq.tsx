const FAQ_ITEMS = [
  {
    q: 'What is Shehri Co.?',
    a: "Shehri Co. is India's first bottoms-only D2C streetwear brand. We make Korean pants and baggy linen pants — premium bottoms built for Indian streets, starting with Delhi.",
  },
  {
    q: 'What is a Korean pant?',
    a: "Korean pants are trousers inspired by Korean streetwear fashion — relaxed but tailored, clean lines, slightly tapered hem. Shehri Co.'s version is built for Indian sizing and summers.",
  },
  {
    q: 'What is the difference between Korean pants and baggy linen pants?',
    a: 'Korean pants India offer a structured, clean silhouette. Baggy linen pants India are fully oversized in natural linen — breathable for summer. Both are Batch 001.',
  },
  {
    q: 'When will my preorder ship?',
    a: 'Batch 001 preorders ship within 21 days of the window closing. Delhi NCR orders dispatch first.',
  },
  {
    q: 'How much does delivery cost?',
    a: 'Free delivery within Delhi NCR. ₹199 flat for the rest of India.',
  },
  {
    q: 'How many units are in Batch 001?',
    a: 'Limited preorder streetwear India run — no restocks once Batch 001 sells through.',
  },
];

export function PreLaunchFaq() {
  return (
    <section
      id="faq"
      className="py-16 md:py-24 border-b border-stone bg-paper"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto w-full px-6 md:px-12">
        <h2 id="faq-heading" className="font-bebas text-3xl md:text-4xl mb-8">
          Questions before you lock size
        </h2>
        <dl className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q}>
              <dt>
                <h3 className="font-rajdhani font-bold uppercase tracking-wide text-base mb-2">{item.q}</h3>
              </dt>
              <dd className="font-mono text-sm text-ink/70 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
