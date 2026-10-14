# ZieAds: rules for anyone (human or AI) writing code or copy

## Writing rule: no em dash, ever
- Never use the em dash (U+2014) or the en dash (U+2013) anywhere in ZieAds: UI copy, landing page, emails, legal pages, AI prompts, AI output, code comments, SQL, docs.
- Use a comma, a period, a colon or a plain hyphen instead. Ranges are written 3-5.
- How it is enforced:
  - `npm run build` runs `scripts/check-no-em-dash.mjs` first and FAILS if one is found. Fix with `node scripts/check-no-em-dash.mjs --fix` or rewrite the sentence.
  - `server/utils/noEmDash.ts` holds `NO_EM_DASH_RULE` (appended to every AI system prompt) and `stripDashes()`.
  - `server/app.ts` cleans every JSON response, and the AI Agent stream is cleaned token by token, so stored data and AI text never show one either.

## Copy
- SEO friendly, based on the v0.3 feature set, benchmarked against Buffer and Metricool.
- Design language: system font, clean white, orange #F26522, numbered section badges, motion everywhere.

## AI Agent
- See `server/agent/` (runtime + tools). Everything the agent creates is a draft the user reviews: posts land on the calendar with status `draft`, comment replies are saved in `comments_inbox.reply_text` without sending, competitors are added to Hunt.

## Icons
- Social platforms ALWAYS use their official logos via `SocialIcon` (brand marks in `src/components/v3/brandMarks.ts`). Never replace them with generic or Noun Project icons.
- UI icons go through `ZIcon` (semantic names in `src/components/icons/icon-terms.json`) and render as lucide line icons. A Noun Project icon is only used after it is reviewed and its key is added to `src/components/icons/nounApproved.ts`.
- The Zie character (`ZieAvatar`) is the AI Agent's avatar. In menus and tabs the agent uses a line icon.

## Buttons
- Product UI (dashboard, AI Agent, settings) uses the compact `Button` from `src/components/v3/ui.tsx` (rounded 8px, variants primary, soft, secondary, ghost, danger). One primary per view.
- The pill `TextRollButton` is only for marketing surfaces: landing page, auth, onboarding modal, pricing, quick scan result. See `docs/button-guidelines.md`.

## No AI slop patterns
- Never build a card, list item or input with a colored accent bar on one side (border-left stripe, side bar pseudo element). Selected or active items use a white background, a soft shadow and bolder text.
- Status badges (sentiment, draft state, buying question) use `Pill`: a neutral chip with a 1px border, ink text and a 6px colored dot. Never pastel filled pills (mint green, pink, peach) with colored text, and no gradient tints on rows. Color is never the only signal: the label says the state.
- Status colors are muted (`--zd-good`, `--zd-warn`, `--zd-bad` in `dash.css`) and live on dots, icons and thin marks, not on text or large fills.
- Never use the sparkle icon for Zie or AI actions. Name the action instead: `briefing` (newspaper) for Compile briefing, `reply-draft` for Draft replies, `analyze` for Analyze, a plain arrow for Do it.
