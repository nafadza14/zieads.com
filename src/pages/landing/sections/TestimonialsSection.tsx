import { testimonials } from '../data';

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <span className="section-eyebrow">
        From people using it
      </span>
      <h2 className="section-title" style={{ marginTop: 8 }}>
        What changed when the agent took over.
      </h2>
      <div className="testimonials-grid">
        {testimonials.map((t, i) => (
          <div key={i} className="testimonial-card">
            <div className="testimonial-stars">
              {[...Array(5)].map((_, si) => (
                <svg key={si} className="lp-star" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <p className="testimonial-quote">"{t.quote}"</p>
            <div className="testimonial-author">
              <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
              <div>
                <div className="testimonial-name">{t.name}</div>
                <div className="testimonial-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
