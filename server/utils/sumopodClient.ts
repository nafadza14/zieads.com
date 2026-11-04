import { NO_EM_DASH_RULE, stripDashes } from "./noEmDash.js";
import { SUMOPOD_CHAT_URL, sumopodModel, isInvalidModel } from "./sumopodModel.js";

/** One chat call to Sumopod. If the model name was retired, it re-reads the model list and retries once. */
export async function sumopodChat(apiKey: string, body: Record<string, unknown>): Promise<{ data: any; model: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const model = await sumopodModel(apiKey, attempt > 0);
    const response = await fetch(SUMOPOD_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ ...body, model }),
    });
    if (response.ok) return { data: await response.json(), model };
    const errText = await response.text();
    if (attempt === 0 && isInvalidModel(response.status, errText)) continue;
    throw new Error(`Sumopod API Error (${response.status}): ${errText}`);
  }
  throw new Error("Sumopod API Error: no model available for this key");
}
export class MockAnthropic {
  messages = {
    create: async (params: {
      model: string;
      max_tokens?: number;
      system?: string | Array<any>;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => {
      const sumopodApiKey = process.env.SUMOPOD_API_KEY;
      if (!sumopodApiKey) {
        throw new Error("SUMOPOD_API_KEY environment variable is not configured.");
      }
      
      
      const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (params.system) {
        let systemPrompt = "";
        if (typeof params.system === "string") {
          systemPrompt = params.system;
        } else if (Array.isArray(params.system)) {
          for (const item of params.system) {
            if (item && typeof item === "object") {
              if (item.text && typeof item.text === "string") {
                systemPrompt += (systemPrompt ? "\n" : "") + item.text;
              } else if (item.content && typeof item.content === "string") {
                systemPrompt += (systemPrompt ? "\n" : "") + item.content;
              }
            } else if (typeof item === "string") {
              systemPrompt += (systemPrompt ? "\n" : "") + item;
            }
          }
        }
        if (systemPrompt) {
          openAiMessages.push({ role: "system", content: `${systemPrompt}\n\n${NO_EM_DASH_RULE}` });
        }
      }
      for (const msg of params.messages) {
        openAiMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        });
      }

      const { data, model } = await sumopodChat(sumopodApiKey, { messages: openAiMessages, max_tokens: params.max_tokens || 2048, temperature: 0.7 });
      const contentText = stripDashes(data.choices?.[0]?.message?.content || "");

      return {
        id: `sumopod_msg_${Date.now()}`,
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: contentText
          }
        ],
        model,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0
        }
      };
    }
  };
}

export async function callSumopodAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const sumopodApiKey = process.env.SUMOPOD_API_KEY;
  if (!sumopodApiKey) {
    throw new Error("SUMOPOD_API_KEY environment variable is not configured.");
  }
  
  
  const openAiMessages = [
    { role: "system", content: `${systemPrompt}\n\n${NO_EM_DASH_RULE}` },
    { role: "user", content: userPrompt }
  ];

  const { data } = await sumopodChat(sumopodApiKey, { messages: openAiMessages, max_tokens: 4000, temperature: 0.7 });
  return stripDashes(data.choices?.[0]?.message?.content || "");
}
