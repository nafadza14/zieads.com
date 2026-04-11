import express from 'express';
import { supabaseAdmin } from '../supabaseServer.js';
import { runQuickScan } from '../agents.js';
import { scrapeUrl } from '../scraper.js';

export const publicApiRouter = express.Router();

/**
 * Middleware: Validate the API Key provided in HTTP Headers
 */
async function validateApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Provide a Bearer API Key.' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify API Key in database
  const { data: keyRecord, error } = await supabaseAdmin
    .from('api_keys')
    .select('user_id')
    .eq('key_value', token)
    .single();

  if (error || !keyRecord) {
    return res.status(403).json({ error: 'Invalid API Key. Webhook denied.' });
  }

  // Attach resolved User ID to the request for logging
  (req as any).apiUserId = keyRecord.user_id;
  next();
}

/**
 * POST /v1/audit
 * Trigger a quick scan externally (Zapier/Make.com integration)
 */
publicApiRouter.post('/audit', validateApiKey, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: '"url" parameter is required in JSON body.' });
  }

  const userId = (req as any).apiUserId;
  console.log(`[Public API] Webhook triggered Quick Scan for ${url} by User ${userId}`);

  try {
    const scrapedData = await scrapeUrl(url);
    const ctx = {
      url,
      businessName: scrapedData.title || new URL(url).hostname,
      businessType: scrapedData.inferredBusinessType,
      primaryGoal: 'Not specified via API',
      monthlyBudget: 'Not specified',
      platforms: [],
      scrapedData
    };

    const result = await runQuickScan(ctx);

    // Return the structured payload matching Zapier's expected JSON format
    res.status(200).json({
      success: true,
      url,
      overallScore: result.score,
      criticalFindingsCount: result.findings.length,
      topFindings: result.findings.map(f => f.title),
      reportUrl: `https://zieads.com/reports/${userId}?url=${encodeURIComponent(url)}`
    });

  } catch (err: any) {
    console.error(`[Public API] Audit failed for ${url}:`, err);
    res.status(500).json({ error: err.message || 'Internal server error while processing the audit.' });
  }
});
