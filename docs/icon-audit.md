# Icon audit

The Sparkles icon was used for almost everything (AI Analyst, drafts, tips, briefings, a free plan note, a LinkedIn reaction). Every icon now goes through a semantic name, so the icon says what the UI means.

## How the system works

- `src/components/icons/icon-terms.json`: semantic name -> Noun Project search term and meaning. Shared by the app and the fetch script.
- `src/components/icons/iconRegistry.ts`: `ICONS[name] = { noun, lucide, meaning }`. lucide-react is the fallback.
- `src/components/icons/ZIcon.tsx`: `<ZIcon name="insight" size={16} />`. Renders `NOUN_ICONS['ui-<name>']` (tinted with currentColor through a CSS mask on an inline svg) when it exists and loads, otherwise the lucide fallback with the same size and className.
- Where the icon stood for the AI Agent itself, it is now the `ZieAvatar` component instead of any icon.

## Changes

| File | Meaning there | Old icon | New | Noun search term |
| --- | --- | --- | --- | --- |
| src/components/v3/V3Layout.tsx | Nav item "AI Analyst" | Sparkles | ai-analyst | data analysis |
| src/components/v3/V3Layout.tsx | Nav item "AI Agent" | Bot | ZieAvatar (size 15) | n/a |
| src/components/v3/ui.tsx | Orb that represents the agent | Bot | ZieAvatar (fills the orb) | n/a |
| src/components/v3/ui.tsx | Default EmptyState icon | Bot | empty-state | empty box |
| src/pages/AgentChat.tsx | "Modes" chip | Zap | modes | mode selection |
| src/pages/AgentChat.tsx | Fallback icon of a mode message | Zap | modes | mode selection |
| src/pages/AgentChat.tsx | Finished agent process header | Sparkles | success | task complete |
| src/pages/AgentChat.tsx | "N tasks ran in parallel" | Zap | parallel-tasks | parallel process |
| src/pages/AgentChat.tsx | Fallback icon for an unknown tool step | Zap | tool | wrench tool |
| src/pages/landing/sections/OnboardingModal.tsx | Step "Your AI Agent gets to work" | Sparkles | ZieAvatar (size 16) | n/a |
| src/pages/landing/sections/Navbar.tsx | Feature menu "AI Analyst" | Sparkles | ai-analyst | data analysis |
| src/pages/landing/sections/Navbar.tsx | Feature menu "AI Agent" | Bot | ZieAvatar (size 18) | n/a |
| src/pages/landing/sections/ProductTourSection.tsx | Tour tab "AI Analyst" | Sparkles | ai-analyst | data analysis |
| src/pages/landing/sections/ProductTourSection.tsx | Tour tab "AI Agent" | Bot | ZieAvatar (size 15) | n/a |
| src/pages/landing/sections/ProductTourSection.tsx | Floating chip "Agent status, Watching 24/7" | Sparkles | ZieAvatar (size 15) | n/a |
| src/pages/landing/visuals.tsx | AgentDot orb (the agent) | Bot | ZieAvatar (fills the orb) | n/a |
| src/pages/landing/visuals.tsx | Briefing row "Boost the Reel, pause ad set 3" (Action) | Sparkles | action | call to action |
| src/pages/landing/visuals.tsx | FeatureTile fallback for unknown feature | Sparkles | feature | puzzle piece |
| src/pages/landing/visuals.tsx | "Fix the landing page first" insight | Sparkles | insight | insight lightbulb |
| src/pages/QuickScanResult.tsx | "Free plan, no credit card" | Sparkles | free-plan | gift |
| src/pages/ClientDashboard.tsx | Hint describing the selected skill | Sparkles | tip | information |
| src/pages/ClientDashboard.tsx | Skill result card title | Sparkles | report | report document |
| src/pages/ClientDashboard.tsx | "Daily Brief" card title | Sparkles | briefing | newspaper |
| src/pages/ReportDashboard.tsx | "Core creative strategy" card | Sparkles | creative | creative palette |
| src/pages/v3/AnalystPage.tsx | Empty state "Your first briefing is ready to compile" | Sparkles | briefing | newspaper |
| src/pages/v3/CalendarPage.tsx | "Your AI Agent drafted this post" | Sparkles | ai-draft | draft document |
| src/pages/v3/InboxPage.tsx | "AI draft" badge on a comment | Sparkles | ai-draft | draft document |
| src/pages/v3/InboxPage.tsx | "Drafted by AI Agent, edit and send" | Sparkles | ai-draft | draft document |
| src/pages/v3/StudioPage.tsx | "Weekly Strategy Overview" | Sparkles | strategy | strategy compass |
| src/pages/v3/ComposerPage.tsx | LinkedIn "Celebrate" reaction in preview | Sparkles | celebrate | clapping hands |
| src/pages/v3/ComposerPage.tsx | Schedule option "Publish now" | Zap | publish | paper plane |
| src/pages/v3/ComposerPage.tsx | Banner "Reviewing a draft from your AI Agent" | Sparkles | ai-draft | draft document |
| src/pages/v3/ComposerPage.tsx | "Inheriting from Default" banner | Sparkles | inherit | link chain |
| src/pages/v3/HuntPage.tsx | Stat card "Audited" | Zap | audit | audit checklist |
| src/pages/v3/HuntPage.tsx | "No audit history yet" | Zap | audit | audit checklist |
| src/pages/PricingPage.tsx | Skill runs per plan | Zap | credits | coins |
| src/pages/superadmin/SuperadminDashboard.tsx | Menu "Credits & Usage" | Zap | credits | coins |
| src/pages/settings/BrandSettings.tsx | "Fill from my website" | Wand2 | auto-fill | magic wand |
| src/pages/SkillReport.tsx | Fallback icon for an unknown AI analysis skill | Bot | ai-analyst | data analysis |
| src/pages/PrivacyPolicyPage.tsx | Unused import only | Sparkles | removed | n/a |

Kept on purpose: the Bot icon for the "Chatbot" tool in `visuals.tsx` (it means a third party chatbot, which a bot icon fits). Other icons that already matched their meaning (Calendar, Inbox, BarChart3, Send, and so on) were left alone.

Sparkles usages in `src`: 37 lines before (22 in JSX plus 15 import lines), 0 after.

## Pulling the Noun Project icons

The Noun Project API is not reachable from the build machine, so run the script on your own PC from the repo root (Node 18 or newer, no npm install needed).

Windows CMD:

```
set NOUN_KEY=your_key
set NOUN_SECRET=your_secret
node scripts\fetch-noun-icons.mjs
```

macOS or Linux:

```
NOUN_KEY=your_key NOUN_SECRET=your_secret node scripts/fetch-noun-icons.mjs
```

The script searches one icon per term (landing page terms plus every entry in `src/components/icons/icon-terms.json` as `ui-<name>`), downloads each PNG into `public/noun/<key>.png` and writes `src/pages/landing/noun-icons.ts` with `url: '/noun/<key>.png'`. The icons are self hosted, nothing is hotlinked. Keys are read from the environment only, never commit them. Any key that is missing keeps its lucide fallback.

To add a new meaning: add it to `icon-terms.json`, add its lucide fallback in `iconRegistry.ts`, use `<ZIcon name="..." />`, and run the script again.

## Attribution

Public domain icons are preferred. When an icon is not public domain, the script prints and stores its `attribution` text. That attribution must be kept (for example in the site credits); ZIcon also shows it as the svg title.
