/* Public addresses for the API and MCP server. zieads.com redirects to www, and many MCP
   clients drop the Authorization header on a redirect, so we always show the www address. */
const origin = typeof window === 'undefined' || window.location.hostname === 'zieads.com' ? 'https://www.zieads.com' : window.location.origin;
export const APP_ORIGIN = origin;
export const MCP_URL = `${origin}/mcp`;
export const REST_BASE = `${origin}/api`;
