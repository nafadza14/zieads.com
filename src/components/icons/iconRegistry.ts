/*
  Semantic icon registry: the single source of truth for what each icon MEANS.
  Every entry has a Noun Project search term (fetched by scripts/fetch-noun-icons.mjs
  into NOUN_ICONS under the key `ui-<name>`) and a lucide-react fallback.

  To add a meaning: add it to icon-terms.json (noun term + meaning) and add its
  lucide fallback to LUCIDE below. TypeScript will complain if one side is missing.
*/
import type { LucideIcon } from 'lucide-react';
import {
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Coins,
  Compass,
  FilePen,
  FileText,
  Gift,
  Info,
  LayoutGrid,
  Lightbulb,
  Link2,
  MousePointerClick,
  Newspaper,
  Palette,
  PartyPopper,
  Puzzle,
  Send,
  Split,
  Wand2,
  Wrench,
} from 'lucide-react';
import TERMS from './icon-terms.json';

export type IconName = keyof typeof TERMS;

const LUCIDE: Record<IconName, LucideIcon> = {
  'ai-analyst': BrainCircuit,
  briefing: Newspaper,
  insight: Lightbulb,
  tip: Info,
  action: MousePointerClick,
  feature: Puzzle,
  'free-plan': Gift,
  report: FileText,
  creative: Palette,
  'ai-draft': FilePen,
  strategy: Compass,
  celebrate: PartyPopper,
  publish: Send,
  inherit: Link2,
  audit: ClipboardCheck,
  credits: Coins,
  'auto-fill': Wand2,
  success: CheckCircle2,
  modes: LayoutGrid,
  'parallel-tasks': Split,
  tool: Wrench,
  'empty-state': CircleDashed,
};

export type IconDef = { noun: string; lucide: LucideIcon; meaning: string };

export const ICONS = Object.fromEntries(
  (Object.keys(TERMS) as IconName[]).map((name) => [
    name,
    { noun: TERMS[name].noun, meaning: TERMS[name].meaning, lucide: LUCIDE[name] },
  ]),
) as Record<IconName, IconDef>;
