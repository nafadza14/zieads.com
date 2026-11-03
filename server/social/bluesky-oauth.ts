/*
  Sign in with Bluesky (AT Protocol OAuth) through @atproto/oauth-client-node: PAR, PKCE and DPoP.
  The user types only their handle, approves on their own Bluesky server, and comes back connected.
    client_id   https://www.zieads.com/oauth/bluesky/client-metadata.json
    redirect    https://www.zieads.com/api/auth/bluesky/callback
    jwks        https://www.zieads.com/oauth/bluesky/jwks.json (only with BLUESKY_OAUTH_PRIVATE_JWK)
  With BLUESKY_OAUTH_PRIVATE_JWK set (an ES256 private JWK) ZieAds is a confidential client and sessions
  last months. Without it ZieAds runs as a public client, which Bluesky limits to shorter sessions.
  State and sessions (tokens and the DPoP key) are stored encrypted in bluesky_oauth_store.
*/
import { NodeOAuthClient, JoseKey, requestLocalLock } from "@atproto/oauth-client-node";
import { supabaseAdmin } from "../supabaseServer.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const SCOPE = "atproto transition:generic";

export const publicBase = () => (process.env.OAUTH_REDIRECT_BASE_URL || "https://www.zieads.com").replace(/\/$/, "");

function store(kind: "state" | "session") {
  return {
    async get(key: string) {
      const { data } = await supabaseAdmin.from("bluesky_oauth_store").select("value").eq("kind", kind).eq("key", key).maybeSingle();
      if (!data) return undefined;
      try {
        return JSON.parse(decrypt(data.value));
      } catch {
        return undefined;
      }
    },
    async set(key: string, value: unknown) {
      await supabaseAdmin.from("bluesky_oauth_store").upsert({ kind, key, value: encrypt(JSON.stringify(value)), updated_at: new Date().toISOString() }, { onConflict: "kind,key" });
    },
    async del(key: string) {
      await supabaseAdmin.from("bluesky_oauth_store").delete().eq("kind", kind).eq("key", key);
    },
  };
}

export function clientMetadata(base = publicBase(), confidential = !!process.env.BLUESKY_OAUTH_PRIVATE_JWK) {
  return {
    client_id: `${base}/oauth/bluesky/client-metadata.json`,
    client_name: "ZieAds",
    client_uri: base,
    logo_uri: `${base}/favicon-32.png`,
    tos_uri: `${base}/terms`,
    policy_uri: `${base}/privacy-policy`,
    redirect_uris: [`${base}/api/auth/bluesky/callback`] as [string],
    scope: SCOPE,
    grant_types: ["authorization_code", "refresh_token"] as ["authorization_code", "refresh_token"],
    response_types: ["code"] as ["code"],
    application_type: "web" as const,
    dpop_bound_access_tokens: true,
    ...(confidential ? { token_endpoint_auth_method: "private_key_jwt" as const, token_endpoint_auth_signing_alg: "ES256", jwks_uri: `${base}/oauth/bluesky/jwks.json` } : { token_endpoint_auth_method: "none" as const }),
  };
}

let clientPromise: Promise<NodeOAuthClient> | null = null;

export function blueskyClient(): Promise<NodeOAuthClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const jwk = process.env.BLUESKY_OAUTH_PRIVATE_JWK;
      const keyset = jwk ? [await JoseKey.fromImportable(JSON.parse(jwk), JSON.parse(jwk).kid || "zieads-1")] : undefined;
      return new NodeOAuthClient({
        clientMetadata: clientMetadata(publicBase(), !!keyset) as any,
        ...(keyset ? { keyset } : {}),
        stateStore: store("state") as any,
        sessionStore: store("session") as any,
        requestLock: requestLocalLock,
      });
    })().catch((e) => {
      clientPromise = null;
      throw e;
    });
  }
  return clientPromise;
}

export async function blueskyAuthorizeUrl(handle: string, state: string): Promise<string> {
  const client = await blueskyClient();
  const url = await client.authorize(handle, { scope: SCOPE, state });
  return url.toString();
}

/** Finishes the sign in and returns who signed in */
export async function blueskyCallback(params: URLSearchParams) {
  const client = await blueskyClient();
  const { session, state } = await client.callback(params);
  const did = session.did;
  let handle = did;
  let displayName = "";
  let avatar = "";
  try {
    const r = await session.fetchHandler(`/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`);
    if (r.ok) {
      const p: any = await r.json();
      handle = p.handle || did;
      displayName = p.displayName || "";
      avatar = p.avatar || "";
    }
  } catch {
    /* the profile is decoration */
  }
  return { did, handle, displayName, avatar, state };
}

/** A signed in session for publishing; it refreshes its own tokens */
export async function blueskySession(did: string) {
  const client = await blueskyClient();
  return client.restore(did);
}

export async function blueskyRevoke(did: string) {
  try {
    const client = await blueskyClient();
    await client.revoke(did);
  } catch {
    /* already gone */
  }
}
