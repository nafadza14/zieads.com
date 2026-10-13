/*
  LANDING PAGE IMAGES
  Two kinds of images live here:

  1. SHOTS: real screenshots of the ZieAds dashboard (demo data), stored in /public/landing/shots.
     Re-capture them whenever the dashboard changes so the landing page always shows the real product.

  2. PHOTOS: lifestyle photos that give each section a human context. Swap any URL on its line.
     Local files work too, for example: briefing: '/landing/photos/briefing.jpg'
     If a photo ever fails to load, the card falls back to a soft brand gradient, so nothing looks broken.
*/

const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const SHOTS = {
  analyst: '/landing/shots/analyst.webp',
  agent: '/landing/shots/agent.webp',
  composer: '/landing/shots/composer.webp',
  calendar: '/landing/shots/calendar.webp',
  analytics: '/landing/shots/analytics.webp',
  inbox: '/landing/shots/inbox.webp',
  hunt: '/landing/shots/hunt.webp',
  connections: '/landing/shots/connections.webp',
};

export const PHOTOS = {
  audit: u('1460925895917-afdab827c52f'), // laptop showing analytics charts
  briefing: u('1497032628192-86f99bcd76bc'), // morning desk: laptop, coffee
  composer: u('1611162617474-5b21e879e113'), // social media apps on a phone
  analytics: u('1551288049-bebda4e38f71'), // analytics dashboard on screen
  inbox: u('1512941937669-90a1b58e7e9c'), // hand holding a smartphone
  hunt: u('1542744173-8e7e53415bb0'), // team reviewing strategy
  consolidation: u('1522071820081-009f0129c71c'), // team working around one laptop
  approval: u('1600880292203-757bb62b4baf'), // marketer approving on a laptop
  founder: u('1573164713988-8665fc963095', 900), // founder at her laptop
  freelancer: u('1501504905252-473c47e087f8', 900), // freelancer workspace
  agency: u('1521737604893-d14cc237f11d', 900), // agency team
  faq: u('1600880292089-90a7e086ee0c', 900), // people at work
  final: u('1556761175-5973dc0f32e7', 1800), // team meeting
};

// Backwards compatibility for older imports
export const IMG = PHOTOS as Record<string, string>;
