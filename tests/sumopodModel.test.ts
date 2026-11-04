import { test } from "node:test";
import assert from "node:assert/strict";
import { pickModel, sumopodModel, resetModelCache, isInvalidModel } from "../server/utils/sumopodModel.ts";

test("pickModel prefers the configured name, then MiniMax-M2.7, then any MiniMax", () => {
  assert.equal(pickModel(["gpt-4o", "MiniMax-M2.7", "MiniMax-M2.7-fast"], "MiniMax-M2.7"), "MiniMax-M2.7");
  assert.equal(pickModel(["gpt-4o", "minimax/MiniMax-M2.7"], "MiniMax-M2.7-highspeed"), "minimax/MiniMax-M2.7");
  assert.equal(pickModel(["gpt-4o", "MiniMax-M2.7-lightning"], "x"), "MiniMax-M2.7-lightning");
  assert.equal(pickModel(["gpt-4o", "MiniMax-M2.5"], "x"), "MiniMax-M2.5");
  assert.equal(pickModel(["gpt-4o"], "MiniMax-M2.7"), "MiniMax-M2.7");
  assert.equal(pickModel(["gpt-4o", "MiniMax-M2.7"], "gpt-4o"), "gpt-4o");
});

test("sumopodModel reads /v1/models once and caches, falls back when the list fails", async () => {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response(JSON.stringify({ data: [{ id: "MiniMax-M2.7" }, { id: "gpt-4o" }] }), { status: 200 }); }) as any;
  try {
    resetModelCache();
    delete process.env.SUMOPOD_MODEL; delete process.env.AGENT_OPENAI_MODEL;
    assert.equal(await sumopodModel("sk-x"), "MiniMax-M2.7");
    assert.equal(await sumopodModel("sk-x"), "MiniMax-M2.7");
    assert.equal(calls, 1);
    globalThis.fetch = (async () => { throw new Error("offline"); }) as any;
    assert.equal(await sumopodModel("sk-x", true), "MiniMax-M2.7");
  } finally {
    globalThis.fetch = real;
  }
});

test("isInvalidModel matches Sumopod's error", () => {
  assert.ok(isInvalidModel(400, '{"error":{"message":"/chat/completions: Invalid model name passed in model=MiniMax-M2.7-highspeed."}}'));
  assert.ok(!isInvalidModel(401, "Invalid model name"));
  assert.ok(!isInvalidModel(400, "max_tokens too large"));
});
