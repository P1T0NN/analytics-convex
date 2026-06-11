# Production

Before release, run the local gates:

```bash
bun test
bun run test:volume
bun run typecheck
bun run lint
bun run build
```

Read [Scale and limits](./scale-and-limits.md) before tuning production settings.
Run [Load testing](./load-testing.md) locally — it does not consume Convex cloud
quota.

Optional: exercise the [example app](../example/README.md) with `npm run dev` and
inspect Convex Insights on your dev deployment:

```bash
npm run insights
```

Watch for high documents read, high bytes read, slow functions, OCC conflicts,
and pending high-volume events not being drained by the cron. Tune traffic mode,
shard counts, batch size, retention, and query limits based on those signals.

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

7. **Don't skip the crons** — without `analytics.registerCrons()`, high-volume
   events never aggregate and raw events never expire.

8. **Plan for rollup growth** — raw events expire (default 90 days) but daily
   rollups are kept forever unless you set `rollupRetentionDays`. See
   [Scale and limits - Rollup storage](./scale-and-limits.md#rollup-storage).

9. **Retention keeps up automatically** — when a purge run deletes a full
   batch, it immediately schedules another batch (up to 20 per cron tick), so
   high-volume deployments don't fall behind their retention windows.
