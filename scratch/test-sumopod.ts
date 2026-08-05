import dotenv from "dotenv";
dotenv.config();
import { callSumopodAI, MockAnthropic } from "../server/utils/sumopodClient.js";

async function test() {
  console.log("Testing callSumopodAI directly...");
  try {
    const result = await callSumopodAI(
      "You are a helpful assistant.",
      "Say hello in a creative way, and tell me what model you are."
    );
    console.log("SUCCESS!");
    console.log("Result:", result);
  } catch (err: any) {
    console.error("FAILED direct call:", err.message);
  }

  console.log("\nTesting MockAnthropic messages.create client wrapper...");
  try {
    const client = new MockAnthropic();
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1000,
      system: "You are a witty assistant.",
      messages: [{ role: "user", content: "Tell me a joke about robots." }]
    });
    console.log("SUCCESS wrapper!");
    console.log("Response text:", response.content[0].text);
  } catch (err: any) {
    console.error("FAILED wrapper:", err.message);
  }
}

test();
