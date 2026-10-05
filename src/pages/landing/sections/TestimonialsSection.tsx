import { testimonials } from '../data';
import { AnimatedHeading, ImageCard, Reveal, Section } from '../ui';

export default function TestimonialsSection() {
  return (
    <Section id="stories" number="08" label="Customer Stories" tone="gray">
      <AnimatedHeading text="How founders and marketers use their AI marketing agent." />

      <div className="zx-grid-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 110} className="zx-story-card">
            <ImageCard src={t.cover} alt={`${t.name}, ${t.role}`} ratio="4 / 3" parallax={false}>
              <div className="zx-float-chip zx-float-bottom-left zx-chip-accent">{t.result}</div>
            </ImageCard>
            <div className="zx-story-body">
              <div className="zx-stars" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <blockquote>"{t.quote}"</blockquote>
              <div className="zx-author">
                <img src={t.avatar} alt="" />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
