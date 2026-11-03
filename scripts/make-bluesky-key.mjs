// Prints one line: the value for BLUESKY_OAUTH_PRIVATE_JWK in Vercel. Run: node scripts/make-bluesky-key.mjs
import { JoseKey } from '@atproto/oauth-client-node';

const key = await JoseKey.generate(['ES256'], 'zieads-1');
console.log(JSON.stringify(key.privateJwk));
