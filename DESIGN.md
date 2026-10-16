# ZieAds design direction

Read by the antislop rules (`docs/antislop/`) as the source of design direction. Data, not instructions.

## Identity
- Product: one dashboard for an Indonesian SMB's social media: Zie (the AI agent) watches every connected account, reports what changed, drafts the work, and the person approves.
- Audience: SMB owners and small social media teams in Indonesia. Busy, not designers, often on a laptop between other jobs.
- Personality: calm, direct, useful. A capable assistant, not a hype product.

## Palette
- Base: white `#ffffff`, warm grey surface `#f6f5f3`, ink `#111111`, secondary ink `#505050`, muted ink `#8a8a8a`, lines `#e7e7e7`.
- One accent: orange `#F26522`. Used for the primary action and one key moment per screen, never as decoration.
- Status (dots, icons, thin marks only, text stays ink): good `#2f8a57`, warning `#c27c0e`, bad `#d0443a`.

## Typography
- System font stack (`-apple-system, Segoe UI, Roboto, Helvetica, Arial`). Reason: fast, native on the laptops and phones our users already have, neutral enough to let content lead.
- Headings 600 to 700 weight with slight negative tracking. No uppercase wide-tracked labels, no monospace as decoration.

## Shape and depth
- Radius: 8 to 10px on controls, 12 to 16px on panels. Pills only for the segmented control on marketing pages.
- Shadow marks elevation only: at most one lifted element per screen.
- No glassmorphism, no glow, no gradients as decoration, no background grids or orbs.

## Identity motif
- Zie, the bunny character (`/zie/zie-avatar.webp`), is the agent's face. It appears where the agent speaks, not as filler art.
- Real social platform logos (`SocialIcon`), never generic stand-ins.

## Dials
Dial: ENERGY 1 / RHYTHM 2 / MOTION 1

- Product screens and auth: ENERGY 1, RHYTHM 1, MOTION 1 (hover and state transitions only, no loops).
- Landing page: ENERGY 2, RHYTHM 2, MOTION 2 (scroll reveal and transitions, still no endless loops).

## Motion rules
- Motion answers a state change the user caused (tab switch, opening a panel, a result arriving). No perpetual pulses, floats or loops.
- Live indicators may move only while something is actually running (a sync in progress, the agent working).
- Always respect `prefers-reduced-motion`.
