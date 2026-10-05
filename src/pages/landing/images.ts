/*
  LANDING PAGE IMAGES (placeholders)
  Every image on the landing page is pulled from this one file.
  To swap an image, replace the URL on the matching line. Local files in /public
  work too, for example: briefingMain: '/images/briefing.jpg'
*/

const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  // 01 Free Audit
  auditMain: u('1460925895917-afdab827c52f'),
  auditSmall: u('1498050108023-c5249f4df085', 800),

  // 02 AI Analyst / Daily Briefing
  briefingMain: u('1522071820081-009f0129c71c'),
  briefingSmall: u('1495474472287-4d71bcdd2085', 800),
  cardDiagnosis: u('1551288049-bebda4e38f71', 900),
  cardRoas: u('1543286386-713bdd548da4', 900),
  cardFatigue: u('1611162617474-5b21e879e113', 900),
  cardScheduling: u('1611162616305-c69b3fa7fbe0', 900),
  cardCompetitor: u('1553877522-43269d4ea984', 900),
  cardInbox: u('1512941937669-90a1b58e7e9c', 900),

  // 03 Composer & Calendar
  composerMain: u('1432888622747-4eb9a8efeb07'),

  // 04 Analytics
  analyticsA: u('1504868584819-f8e8b4b6d7e3'),
  analyticsB: u('1555421689-491a97ff2040'),

  // 05 Inbox & Competitor Hunt
  inbox: u('1517245386807-bb43f82c33c4'),
  competitor: u('1552664730-d307ca884978'),

  // 06 Consolidation
  consolidation: u('1519389950473-47ba0277781c'),

  // 07 Comparison
  comparison: u('1531482615713-2afd69097998'),

  // 08 Testimonials (cover photos)
  testimonial1: u('1573164713988-8665fc963095', 900),
  testimonial2: u('1507003211169-0a1dd7228f2d', 900),
  testimonial3: u('1600880292203-757bb62b4baf', 900),

  // 09 Who it's for
  personaFounder: u('1556761175-5973dc0f32e7', 900),
  personaFreelancer: u('1521737604893-d14cc237f11d', 900),
  personaAgency: u('1600880292089-90a7e086ee0c', 900),

  // 10 Pricing
  pricingRoi: u('1554224155-6726b3ff858f'),

  // 11 FAQ
  faq: u('1516321318423-f06f85e504b3'),

  // Final CTA
  finalCta: u('1497366216548-37526070297c', 1800),
};
