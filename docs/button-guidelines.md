# ZieAds buttons

## Two button families
- **Marketing (landing page, auth, onboarding modal, pricing, quick scan result):** big orange pill `TextRollButton` with text roll and arrow. Its job is to convert visitors.
- **Product (dashboard, AI Agent, settings, reports):** compact rounded rectangle `Button` from `src/components/v3/ui.tsx`, shaped like the "Featured" badge. Its job is to get work done quickly, many times a day, so it must be calm, small and predictable.

## Product button spec
| Variant | Look | Use for |
|---|---|---|
| `primary` | Orange fill, white text | The ONE main action of a page (Create post, Refresh briefing, Export PDF, Save brand profile, Publish) |
| `soft` | Orange tint, dark orange text | Actions repeated in cards or lists (Connect Meta Ads, Run analysis, Approve) |
| `secondary` | White, 1px border | Neutral actions (Open calendar, Dashboard, Settings, Exit demo) |
| `ghost` | Text only | Low emphasis (Close, Skip, View all) |
| `danger` | Red tint | Destructive (Delete, Disconnect) |

- Sizes: `sm` 30px, `md` 34px (default), `lg` 40px for the final step of a form (Publish, Save).
- Shape: radius 8px (7px small, 9px large). Pills stay only for chips, filters, tags and status badges.
- Type: 13px, weight 600, optional 15px leading icon. No arrow circles, no text roll, no lift on hover.
- States: hover darkens, press scales to 0.98, focus shows an orange ring, `loading` shows a spinner and blocks double clicks.
- One primary per view. Lists with many actions use `soft` or `secondary`.

## Why (research)
- Carbon (IBM): one primary button per page; when a view has many calls to action use lower emphasis buttons; product UIs use the compact "productive" size while expressive sizes are for website banners. https://carbondesignsystem.com/components/button/usage
- Vercel Geist separates marketing buttons (rounded with shadow) from product buttons (square/rounded, sizes tiny to large, variants default, secondary, tertiary, error, warning). https://vercel.com/design/button
- Survey of 514 design systems: pills read as consumer/marketing, 7 to 12px radius reads as professional SaaS. https://www.lazyweb.com/research/what-button-corner-radius-is-standard
- Social media tools (Buffer, Hootsuite, Sprout Social, Metricool, Later) use small rounded rectangle buttons inside their apps and keep large pill CTAs for their marketing sites.
