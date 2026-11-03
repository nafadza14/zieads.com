/*
  Heartbeat: one scheduler entry that runs every background job in order.
  Each step has its own time budget and never stops the next step from running.
  Vercel Hobby allows one run a day per cron; for publishing within a minute of
  the scheduled time, call /api/v3/cron/publish-scheduled every minute from an
  external scheduler (see docs/scheduler.md).
*/
import { runDuePosts } from "../publish/publisher.js";
import { syncAllFacebook } from "../facebook/sync.js";
import { runGuardian } from "../guardian/guardian.js";
import { runDueBriefings } from "../briefing/briefing.js";

export type Step = { name: string; run: () => Promise<unknown> };

const steps: Step[] = [
  // Budgets add up to about 50 seconds, inside the 60 second function limit
  { name: "publish", run: () => runDuePosts(15000) },
  { name: "facebook_sync", run: () => syncAllFacebook(10000) },
  { name: "guardian", run: () => runGuardian(10000) },
  { name: "briefings", run: () => runDueBriefings(10000) },
];

/** Later modules add their steps here (Guardian, briefings, scheduled agents) */
export function registerStep(step: Step) {
  if (!steps.find((s) => s.name === step.name)) steps.push(step);
}

export async function runHeartbeat(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const s of steps) {
    const t = Date.now();
    try {
      out[s.name] = { ok: true, ms: 0, result: await s.run() };
    } catch (e: any) {
      out[s.name] = { ok: false, error: e?.message };
      console.error(`[heartbeat] ${s.name} failed:`, e);
    }
    (out[s.name] as any).ms = Date.now() - t;
  }
  return out;
}
