/*
  Which Sumopod model to call. Sumopod renames models now and then (MiniMax-M2.7-highspeed stopped
  existing), so instead of a hard coded name ZieAds asks /v1/models once and picks the best match:
    1. SUMOPOD_MODEL (or AGENT_OPENAI_MODEL, default deepseek-v4-flash) exactly, when the key has it
    2. a model whose id contains that name (for example deepseek/deepseek-v4-flash)
    3. another DeepSeek model, then MiniMax-M2.7, then any MiniMax model
  The choice is cached for an hour. If the list can not be read, the preferred name is used as is.
*/
export const SUMOPOD_CHAT_URL = "https://ai.sumopod.com/v1/chat/completions";
const MODELS_URL = "https://ai.sumopod.com/v1/models";
const TTL_MS = 60 * 60 * 1000;

export const preferredModel = () => process.env.SUMOPOD_MODEL || process.env.AGENT_OPENAI_MODEL || "deepseek-v4-flash";

let cache: { model: string; at: number; preferred: string } | null = null;

/** Picks the model from the ids the key can use */
export function pickModel(ids: string[], preferred = preferredModel()): string {
  const lower = (s: string) => s.toLowerCase();
  const find = (f: (id: string) => boolean) => ids.find((id) => f(lower(id)));
  return (
    find((id) => id === lower(preferred)) ||
    find((id) => id.endsWith(`/${lower(preferred)}`) || id.includes(lower(preferred))) ||
    find((id) => id.includes("deepseek-v4")) ||
    find((id) => id.includes("deepseek")) ||
    find((id) => id === "minimax-m2.7" || id.endsWith("/minimax-m2.7")) ||
    find((id) => id.includes("minimax-m2.7")) ||
    find((id) => id.includes("minimax")) ||
    preferred
  );
}

export async function sumopodModel(apiKey = process.env.SUMOPOD_API_KEY || "", fresh = false): Promise<string> {
  const preferred = preferredModel();
  if (!fresh && cache && cache.preferred === preferred && Date.now() - cache.at < TTL_MS) return cache.model;
  let model = preferred;
  try {
    const res = await fetch(MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const j: any = await res.json();
      const ids = (j.data || []).map((m: any) => String(m.id || "")).filter(Boolean);
      if (ids.length) model = pickModel(ids, preferred);
    }
  } catch {
    /* use the preferred name */
  }
  cache = { model, at: Date.now(), preferred };
  return model;
}

/** True when Sumopod says the model name does not exist for this key */
export const isInvalidModel = (status: number, body: string) => status === 400 && /invalid model name|model.*not.*(found|exist)/i.test(body);

export function resetModelCache() {
  cache = null;
}
