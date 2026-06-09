# Production

Before release, run the local gates:

```bash
bun run test
bun run test:stress
bun run typecheck
bun run lint
bun run build
```

Then exercise staging with realistic event volume, event names, scopes,
dimensions, and query ranges. During that run, inspect Convex Insights:

```bash
bun run insights
bun run insights:prod
```

Watch for high documents read, high bytes read, slow functions, OCC conflicts,
and pending high-volume events not being drained by the cron. Tune traffic mode,
shard counts, batch size, retention, and query limits based on those signals.

---

---

## Best practices

1. **Define events and metrics upfront** — adding a metric later means it only
   tracks future events (unless you build a custom backfill using the raw event
   table).

2. **Use the scheduler pattern** — `writeTrack()` returns immediately. If you
   need confirmation that an event was recorded, query the event table by
   idempotency key.

3. **Keep dimensions low-cardinal** — dimensions like `userId` or `sessionId`
   will create one rollup row per value per day, blowing up the rollup table and
   hitting `maxRollupRowsPerQuery`. Use dimensions for categorical data (plan,
   feature, path), not unique identifiers.

4. **Start with `mediumVolume`** — it's the safest default. Move individual hot
   metrics to `highVolume` if you see write contention or OCC errors around
   analytics writes.

5. **Configure scopes early** — if you're building a multi-tenant app, scope
   events by organization from day one. Retrofitting scopes requires a full
   event backfill.

6. **Keep analytics config in code** — change events, metrics, and settings in
   `convex/analytics.ts`. The app-side helpers pass that runtime config into the
   component automatically, so no configure command is required after deploys.

7. **Don't skip the crons** — without `registerAnalyticsCrons`, high-volume
   events never aggregate and raw events never expire.
