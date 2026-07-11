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
      
      const endpoint = "https://ai.sumopod.com/v1/chat/completions";
      
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
          openAiMessages.push({ role: "system", content: systemPrompt });
        }
      }
      for (const msg of params.messages) {
        openAiMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        });
      }

      console.log(`[Sumopod AI] Routing Claude API call to Sumopod (model: MiniMax-M2.7-highspeed)...`);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sumopodApiKey}`
        },
        body: JSON.stringify({
          model: "MiniMax-M2.7-highspeed",
          messages: openAiMessages,
          max_tokens: params.max_tokens || 2048,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sumopod API Error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      const contentText = data.choices?.[0]?.message?.content || "";

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
        model: "MiniMax-M2.7-highspeed",
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
  
  const endpoint = "https://ai.sumopod.com/v1/chat/completions";
  
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  console.log(`[Sumopod AI] Calling Sumopod directly (model: MiniMax-M2.7-highspeed)...`);
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sumopodApiKey}`
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7-highspeed",
      messages: openAiMessages,
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sumopod API Error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
