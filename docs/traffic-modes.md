# Traffic Modes

Every metric operates in one of three traffic modes. Choose based on expected
event volume and concurrency.

### `lowVolume`

Best for prototypes, admin panels, and internal tools.

- **Writes:** one rollup row per metric/day/scope/dimension — no sharding
- **Reads:** fewest rows per query
- **When to use:** < 5 events/sec sustained, < 25 events/sec bursts, < 50
  concurrent users

### `mediumVolume` (default)

Best for normal production SaaS apps.

- **Writes:** sharded across `mediumVolumeShardCount` rows (default 8) — spreads
  concurrent writes
- **Reads:** sums shard rows per query — still cheap
- **When to use:** 5–50 events/sec sustained, 100–300 events/sec bursts,
  50–1,000 concurrent users

### `highVolume`

Best for noisy product events, webhook-heavy systems, and large tenants.

- **Writes:** raw events are inserted and marked `pending` — a cron job
  processes them in batches of `highVolumeBatchSize`
- **Reads:** same as medium-volume (reads hit rollup rows, not raw events)
- **Trade-off:** dashboards may lag behind raw events by the cron interval
- **When to use:** 50+ events/sec sustained, 300+ events/sec bursts, 1,000+
  concurrent users

Per-metric override: set `trafficMode` on individual metrics in the metric
config. Unset metrics inherit the global setting.

### Recommended starting settings

These are starting points, not permanent rules. Confirm them with realistic load
and Convex Insights before treating them as production defaults.

| Traffic profile                                                | Recommended setup                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Low: prototypes, admin tools, under 5 events/sec sustained     | Global `trafficMode: "lowVolume"`, defaults for shard counts, retention 30-90 days, retention cron daily                                                                                                                                                                                             |
| Medium: normal SaaS, 5-50 events/sec sustained                 | Global `trafficMode: "mediumVolume"`, `mediumVolumeShardCount: 8-16`, `highVolumeShardCount: 32`, `highVolumeBatchSize: 250`, high-volume cron every 1-5 minutes                                                                                                                                     |
| High: noisy product events, webhooks, 50+ events/sec sustained | Keep normal metrics on `mediumVolume`, mark hot metrics `trafficMode: "highVolume"`, use `writeTrack({ events })` or `analytics.writeTrack(ctx, { events })`, `highVolumeShardCount: 64-128`, `highVolumeBatchSize: 500-1_000`, `highVolumeMaxCatchupBatches: 4-10`, high-volume cron every 1 minute |

For firehose-style intake, buffer events in your app or worker and send chunks
of at most `ANALYTICS_LIMITS.maxTrackBatchSize`. If Convex Insights shows OCC
conflicts on rollups, increase the relevant shard count or move that metric to
`highVolume`. If Insights shows high read volume on dashboard queries, reduce
`maxQueryRangeDays`, `maxRollupRowsPerQuery`, or dimension cardinality.

---
