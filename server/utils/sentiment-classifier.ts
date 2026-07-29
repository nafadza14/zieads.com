import { supabaseAdmin } from '../supabaseServer.js';
import { getClaudeClient } from './instagramHelpers.js';

export async function classifyCommentsAsync(comments: Array<{ id: string, text: string }>) {
  if (comments.length === 0) return;

  const batchSize = 10;
  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);

    await Promise.all(batch.map(async (comment) => {
      try {
        const text = (comment.text || "").trim();
        
        // Skip classification for very short comments (< 5 chars) or emoji-only/non-alphanumeric comments
        const cleanText = text.replace(/[\s\p{Emoji}]/gu, '');
        if (text.length < 5 || cleanText.length === 0) {
          await supabaseAdmin
            .from('comments_inbox')
            .update({
              sentiment: 'neutral',
              sentiment_confidence: 0
            })
            .eq('id', comment.id);
          return;
        }

        const result = await classifyOne(text);
        await supabaseAdmin
          .from('comments_inbox')
          .update({
            sentiment: result.sentiment,
            sentiment_confidence: result.confidence
          })
          .eq('id', comment.id);
      } catch (err: any) {
        console.error(`[Sentiment Classifier] Failed for comment ${comment.id}:`, err.message);
        // Set default neutral so it's not stuck as null forever
        await supabaseAdmin
          .from('comments_inbox')
          .update({ sentiment: 'neutral', sentiment_confidence: 0 })
          .eq('id', comment.id);
      }
    }));
  }
}

async function classifyOne(text: string): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
  try {
    const claude = getClaudeClient();
    const systemPrompt = 'You are a sentiment classifier for social media comments on a marketing SaaS tool. Classify the comment as positive, neutral, or negative based on its overall tone toward the brand or product. Respond ONLY with valid JSON: {"sentiment": "positive|neutral|negative", "confidence": 0.0-1.0}. No other text.';

    const response = await claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      system: [
        {
          type: "text",
          text: systemPrompt,
          // @ts-ignore
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [{ role: 'user', content: text.slice(0, 500) }]  // truncate very long comments
    }, {
      headers: {
        "anthropic-beta": "prompt-caching-2024-07-31"
      }
    });

    const jsonText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const parsed = JSON.parse(jsonText);

    // Validate response shape
    if (!['positive', 'neutral', 'negative'].includes(parsed.sentiment)) {
      return { sentiment: 'neutral', confidence: 0 };
    }

    return {
      sentiment: parsed.sentiment,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0))
    };
  } catch (err: any) {
    console.error(`[Sentiment Classifier ClassifyOne Error]`, err.message);
    throw err;
  }
}
