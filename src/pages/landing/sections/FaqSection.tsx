import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqItems } from '../data';

export default function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <section id="faq" className="faq-section">
      {/* Numbered Badge */}
      <div className="axion-badge-row" style={{ justifyContent: 'center' }}>
        <span className="axion-badge-number">11</span>
        <span className="axion-badge-label">FAQ</span>
      </div>

      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-grid">
        {faqItems.map((item, i) => (
          <div key={i} className={`faq-item ${openFaqIndex === i ? 'faq-open' : ''}`}>
            <button
              className="faq-summary"
              onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
              aria-expanded={openFaqIndex === i}
            >
              {item.q}
              <ChevronDown size={18} className="faq-chevron" />
            </button>
            {openFaqIndex === i && (
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
