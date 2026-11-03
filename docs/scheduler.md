# Background jobs and the scheduler

ZieAds runs every background job through a few HTTP endpoints. Each one needs the header
`Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this header automatically when
`CRON_SECRET` is set in the project). Without a secret the endpoints refuse to run.

| Endpoint | What it does | How often |
|---|---|---|
| `/api/v3/cron/publish-scheduled` | Publishes posts that are due, with 3 retries and a Guardian task on failure | Every minute |
| `/api/v3/jobs/run` | Heartbeat: publish, Facebook sync, Guardian checks, briefings that are due | Every 15 minutes |
| `/api/v3/cron/scheduled-agents` | Runs scheduled agents that are due (up to 3 per call, each up to 30 seconds) | Every 15 minutes |
| `/api/v3/cron/sync-instagram-comments` | Instagram comment polling fallback | Every 15 minutes |
| `/api/v3/cron/sync-facebook` | Facebook polling fallback (also part of the heartbeat) | Optional |
| `/api/v3/monitor/tick` | AI Analyst monitoring | Daily |

## Why an external scheduler

Vercel Hobby runs each cron at most once a day. That is fine for the daily monitor, but a post
scheduled for 09:00 must go out at 09:00 (spec 7.4: within one minute). Two options:

1. Vercel Pro: change the schedules in `vercel.json` to `* * * * *` and `*/15 * * * *`.
2. Any external scheduler (cron-job.org, GitHub Actions, Supabase pg_cron with `net.http_get`):
   call the endpoints above with the bearer header.

Example with Supabase pg_cron:

```sql
select cron.schedule('zieads-publish', '* * * * *', $$
  select net.http_get(
    url := 'https://zieads.com/api/v3/cron/publish-scheduled',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
  );
$$);
```

All jobs are safe to run more than once: a post is claimed with a conditional update before it is
sent, so two runs can never publish it twice. Scheduled agents are claimed the same way.

## MCP

The MCP server lives at `https://zieads.com/api/mcp` (Streamable HTTP, JSON responses, no session).
Keys are created in Settings, API and MCP. It needs no scheduler.
