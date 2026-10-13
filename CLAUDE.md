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
