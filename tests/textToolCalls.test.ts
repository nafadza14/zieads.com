import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTextToolCalls, ToolMarkupGate, stripToolMarkup } from "../server/agent/textToolCalls.ts";
process.env.SUPABASE_URL ||= "http://127.0.0.1:1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test";
const { AGENT_TOOLS } = await import("../server/agent/tools.ts");

const D = "]<]minimax[>[";
const sample = `Siap, ini drafnya.\n${D}<tool_call>\n${D}<invoke name="create_draft_posts">${D}<posts>${D}<item>${D}<platform>linkedin${D}</platform>${D}<caption>Baris satu.\n1. Post mana yang perform\n2. Komentar &amp; inbox${D}</caption>${D}<hashtags>#socialmedia #UMKM #founder${D}</hashtags>${D}<scheduled_for>2026-11-04T11:00:00+07:00${D}</scheduled_for>${D}<content_type>text${D}</content_type>${D}</item>${D}<item>${D}<platform>linkedin${D}</platform>${D}<caption>Kedua${D}</caption>${D}</item>${D}</posts>${D}</invoke>\n${D}</tool_call>`;

test("MiniMax text tool calls become real calls shaped by the schema", () => {
  const calls = parseTextToolCalls(sample, AGENT_TOOLS as any);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "create_draft_posts");
  const posts = calls[0].args.posts;
  assert.equal(posts.length, 2);
  assert.equal(posts[0].platform, "linkedin");
  assert.equal(posts[0].caption, "Baris satu.\n1. Post mana yang perform\n2. Komentar & inbox");
  assert.deepEqual(posts[0].hashtags, ["#socialmedia", "#UMKM", "#founder"]);
  assert.equal(posts[0].scheduled_for, "2026-11-04T11:00:00+07:00");
  assert.equal(posts[1].caption, "Kedua");
});

test("parameter style and JSON bodies, single item, unknown tools ignored", () => {
  const a = parseTextToolCalls('<invoke name="create_draft_posts"><parameter name="posts">[{"platform":"instagram","caption":"Hi"}]</parameter></invoke><invoke name="rm_rf"></invoke>', AGENT_TOOLS as any);
  assert.deepEqual(a, [{ name: "create_draft_posts", args: { posts: [{ platform: "instagram", caption: "Hi" }] } }]);
  const b = parseTextToolCalls('<tool_call><invoke name="create_draft_posts"><posts><item><platform>x</platform><caption>One</caption></item></posts></invoke></tool_call>', AGENT_TOOLS as any);
  assert.equal(b[0].args.posts.length, 1);
  assert.equal(parseTextToolCalls("plain answer with <b>bold</b>", AGENT_TOOLS as any).length, 0);
});

test("the stream gate hides markup even when a marker is split across chunks", () => {
  const g = new ToolMarkupGate();
  const chunks = ["Siap, ini dra", "fnya.\n]<]mini", "max[>[<tool_call> secret", " more"];
  const shown = chunks.map((c) => g.push(c)).join("") + g.flush();
  assert.equal(shown, "Siap, ini drafnya.\n");
  const g2 = new ToolMarkupGate();
  assert.equal(g2.push("a < b and 1 <") + g2.push(" 2") + g2.flush(), "a < b and 1 < 2");
  assert.equal(stripToolMarkup(sample), "Siap, ini drafnya.");
});
