# AI Analyst: 24/7 monitoring

The AI Analyst (`/analyst`) is the ZieAds home screen. Once an account is connected, Zie keeps checking it and the dashboard answers five questions for the last 24 hours, 3 days, 7 days or 30 days (each compared with the previous period of the same length):

1. What needs me right now? (Needs you now)
2. What happened? (KPI tiles with change vs previous period, What changed timeline)
3. What are people saying? (Comment monitor: volume, sentiment, themes, buying questions, longest waiting)
4. What is working? (Top posts and format averages)
5. What should I do next? (Zie's briefing, one tap to hand a task to the AI Agent)

## How the data flows

| Piece | Where | What it does |
|---|---|---|
| `computeOverview(userId, period)` | `server/monitor/overview.ts` | Builds the whole dashboard from `social_connections`, `comments_inbox`, `social_posts`, `account_insights_daily`, `scheduled_posts`, `anomaly_alerts`, `ai_briefings` |
| `GET /api/v3/analyst/overview?period=24h\|3d\|7d\|30d` | `server/routes/api-v3.ts` | Returns the overview for the signed-in user |
| `POST /api/v3/analyst/sync` | same | Pulls fresh data for the signed-in user (comments, Instagram, TikTok, anomaly scan). Skips if synced in the last 15 min, 2 min with `{ "force": true }` |
| `ALL /api/v3/monitor/tick` | same | The 24/7 loop. Syncs every user whose data is older than `stale_minutes` (default 30), oldest first, within a 50 second budget |
| `get_monitoring_overview(period)` | `server/agent/tools.ts` | Lets Zie answer "what happened in the last 7 days?" from the same numbers |

The dashboard also syncs quietly when it is opened and reloads every 5 minutes while open.

## Turning on the 24/7 loop

Vercel Hobby only allows one cron run per day, so `vercel.json` has a daily safety run (`15 2 * * *`). For real round-the-clock monitoring, call `/api/v3/monitor/tick` every 15 to 30 minutes from an external scheduler.

1. Set `CRON_SECRET` in Vercel (Project Settings, Environment Variables). Use a long random string. In production the tick endpoint refuses to run without it.
2. Pick one scheduler.

### Option A: Supabase pg_cron (recommended, free)

In Supabase, enable the `pg_cron` and `pg_net` extensions (Database, Extensions), then run this once in the SQL editor. Replace the two values first. It is not an auto migration because it contains your secret.

```sql
select cron.schedule(
  'zieads-monitor-tick',
  '*/20 * * * *',
  $$
  select net.http_post(
    url     := 'https://zieads.com/api/v3/monitor/tick?stale_minutes=20',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- check it is running
select * from cron.job_run_details order by start_time desc limit 10;

-- stop it
-- select cron.unschedule('zieads-monitor-tick');
```

### Option B: any uptime or cron service

Point it at `https://zieads.com/api/v3/monitor/tick` every 15 to 30 minutes with the header `Authorization: Bearer YOUR_CRON_SECRET`.

### Option C: Vercel Pro

Change the cron in `vercel.json` to `*/20 * * * *`. Vercel sends `CRON_SECRET` as the bearer token automatically.

## Scaling notes

- One tick handles as many users as fit in 50 seconds, oldest data first, so nobody is starved. If the user count grows past what one tick can cover, run the tick more often or lower `stale_minutes`.
- Platform API limits apply: Instagram Graph API and TikTok have per-token rate limits, so a 15 to 30 minute interval is the sensible floor.
- Alerts follow digest vs urgent: urgent items (negative comments, buying questions, overdue replies, broken connections) appear in Needs you now; everything else goes into the timeline and the morning briefing to avoid alert fatigue.
