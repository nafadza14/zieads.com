import { useState } from 'react';
import { Plus } from 'lucide-react';
import { faqItems } from '../data';
import { IMG } from '../images';
import { AnimatedHeading, ImageCard, Reveal, Section } from '../ui';

// FAQPage structured data for rich results in Google Search
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" number="11" label="FAQ" tone="white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="zx-faq-layout">
        <div className="zx-faq-aside">
          <AnimatedHeading text="Frequently asked questions about ZieAds." />
          <Reveal delay={100}>
            <p className="zx-body">
              Everything you need to know about the AI marketing agent, pricing, supported platforms and data access.
            </p>
          </Reveal>
          <ImageCard src={IMG.faq} alt="Founder reading answers about ZieAds on a laptop" ratio="4 / 3" className="zx-faq-image" />
        </div>

        <div className="zx-faq-list">
          {faqItems.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 50} className={`zx-faq-item ${isOpen ? 'is-open' : ''}`}>
                <h3 className="zx-faq-q-wrap">
                  <button
                    className="zx-faq-q"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="zx-faq-icon">
                      <Plus size={16} />
                    </span>
                  </button>
                </h3>
                <div className="zx-faq-a">
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
