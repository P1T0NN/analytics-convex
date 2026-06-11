# Scale and limits

Honest guidance on what `@piton-/analytics-convex` is built for, where it
performs well, and what will break if misconfigured.

---

## What this library is for

**In-app product metrics inside Convex** — feature usage, revenue counters,
org-scoped activity, admin dashboards. Events are tracked from server
mutations, stored in your deployment, and queried through pre-aggregated
rollups (daily by default, hourly when configured).

**Not a replacement for:**

- Marketing / pageview analytics (Plausible, Umami, etc.) — if you do not care
  about this, ignore; the library still works for product events
- Session replay or ad-hoc exploration UIs (PostHog-style) — same; out of scope
- **Querying billions of raw events inside Convex** — see
  [Long-term scale](#long-term-scale-warehouse-path) below

---

## Sweet spot

| Profile | Fit |
| --- | --- |
| Convex SaaS with org/resource scopes | **Excellent** |
| Server-side tracking from mutations | **Excellent** |
| Dashboards: totals, time series, breakdowns, comparisons | **Excellent** |
| Moderate event rates with low-cardinality dimensions | **Excellent** |
| Hourly charts for low-volume metrics | **Good** — `.hourly()` on metric builder |
| Same-actor event funnels (multi-day) | **Good** — `journeys` + `fetchJourneyConversion` |
| Firehose ingestion, billions of raw events in Convex | **Poor** — export + warehouse |
| High-cardinality dimensions (`userId`, `sessionId`) | **Poor** — blocked at configure time |

Validate behavior locally with `bun run test:volume`. See [Load testing](./load-testing.md).

---

## Traffic modes

Each metric runs in `lowVolume`, `mediumVolume`, or `highVolume`. This is the
primary scaling knob.

| Mode | Write pattern | Best for |
| --- | --- | --- |
| `lowVolume` | Direct rollup, no sharding | Prototypes, hourly metrics, distinct actors |
| `mediumVolume` | Sharded rollup rows (default 8 shards) | Normal SaaS, 5–50 events/sec sustained |
| `highVolume` | Raw insert + cron batch aggregation | Hot metrics, 50+ events/sec sustained |

Details and tuning: [Traffic modes](./traffic-modes.md).

**High-volume trade-off:** dashboards can lag behind raw events by the cron
interval (default 1 minute). Pending events are not counted in rollups until
the batch processor runs.

**Hourly + high-volume:** hourly rollups are **low-volume only**. Use daily
rollups for hot metrics.

---

## Rollup storage

| Table | Retention |
| --- | --- |
| `analyticsEvents` (raw) | Configurable — default **90 days**, purged by cron |
| `analyticsDailyMetrics` (rollups) | Daily or hourly buckets; configurable via `rollupRetentionDays` |
| `analyticsDailyActorClaims` (DAU) | Purged with rollup retention when enabled |
| `analyticsJourneyStepClaims` (journeys) | Purged with rollup retention when enabled |
| `analyticsUniqueEvents` | **Forever** — one row per unique key |
| `analyticsConfigurations` | **Forever** — one row per config hash |

Raw events expire by default. Rollups stay until you set `rollupRetentionDays`
(for example `730` for two years). High-cardinality dimensions are **blocked at
configure time** (`userId`, `sessionId`, etc.) — see
`ANALYTICS_HIGH_CARDINALITY_DIMENSIONS`.

---

## Dimension cardinality (the #1 footgun)

Each distinct dimension value creates rollup rows per metric, per scope, per
bucket (day or hour), times shard count.

**Good dimensions:** `plan`, `feature`, `path`, `status` (tens of values)

**Bad dimensions:** `userId`, `sessionId`, `requestId` (unbounded)

If a query matches more than `maxRollupRowsPerQuery` rollup rows (default
20_000, max 100_000), it throws `QUERY_TOO_LARGE`. Fix by narrowing the date
range, reducing dimensions, or fixing your metric config — not by raising the
limit blindly.

---

## Scopes multiply writes

Every scope on an event writes separate rollup rows for each matching metric and
dimension. A typical pattern:

- `global` (always)
- `organizationId` → org scope
- `subject` → resource scope

That is **three scope partitions** per event per metric. Prefer
`organizationId` + `subject` over long explicit `scopes` arrays. See
[Scopes](./scopes.md).

---

## Query limits

| Setting | Default | Max |
| --- | ---: | ---: |
| `maxQueryRangeDays` | 366 | 3_660 |
| `maxRollupRowsPerQuery` | 20_000 | 100_000 |
| `maxBreakdownItems` | 12 | 100 |
| `maxDashboardMetricsPerQuery` | — | 24 |

Wide date ranges + hourly granularity + many dimension values = expensive reads
even when indexed. Design dashboards for the range users actually need.

---

## Two funnel types

### Metric funnels (`funnels` config)

`fetchFunnelConversion` computes **last step metric ÷ first step metric** over
the same date range and scope. It does **not** require the same actor on both steps.

### Journey funnels (`journeys` config)

`fetchJourneyConversion` tracks **ordered event steps per actor**, bucketed by
UTC day. Step *N* only counts if that actor completed step *N−1* on the same
day or an earlier one — journeys may span multiple days. Requires `actorId` on
tracked events.

`fetchMetricConversion` is ad-hoc ratio math for two metrics without a named
funnel config.

See [Funnels](./funnels.md) for configuration and query examples.

---

## Hard limits

Import `ANALYTICS_LIMITS` from the package for programmatic guards. Full table:
[Configuration — hard limits](./configuration.md#hard-limits).

Notable caps:

- **100 events** per `writeTrack` batch — chunk firehose input in your app
- **8 dimensions** per metric
- **200** events and **200** metrics per configuration
- **50** journeys, **10** steps per journey

---

## When to escalate

| Signal | Action |
| --- | --- |
| OCC conflicts on rollup writes | Increase shard count or move metric to `highVolume` |
| High-volume backlog (pending events) | Shorter cron interval, larger batch, more catch-up batches |
| `QUERY_TOO_LARGE` | Narrow range, remove dimensions, avoid hourly over long ranges |
| Rollup table size growing fast | Audit dimensions and scopes; set `rollupRetentionDays` |
| Need ad-hoc SQL over all raw history | Export pipeline + warehouse (see below) |

For production checklists and Insights: [Production](./production.md).

---

## Long-term scale (warehouse path)

If the goal is to **never migrate away** from this library's API while data
grows without bound, treat Convex as the **hot aggregation layer**, not the
warehouse.

**Principle:** Keep the public contract stable (`defineAnalytics`, metric names,
`fetchSummary`, `fetchTimeSeries`, etc.). Let the **storage backend evolve**
behind that contract.

A practical roadmap:

1. **Rollups forever (in Convex or replicated)** — Dashboard queries keep hitting
   pre-aggregated rows. This is what you have today. Set retention policies
   consciously; rollups are cheap compared to raw events.

2. **Raw event export before purge** — When `rawEventRetentionDays` deletes from
   Convex, stream copies to object storage (Parquet/JSONL). Convex stays fast;
   history survives elsewhere.

3. **Warehouse for cold storage and heavy analytics** — Load exports into
   ClickHouse, BigQuery, Snowflake, or DuckDB. Run ad-hoc SQL, cohort exports,
   and backfills there — not inside Convex queries.

4. **Optional dual-read layer (future)** — Same server helpers; long-range or
   custom queries can fan out to the warehouse while dashboards stay on rollups.
   Apps never rewrite tracking code.

5. **Config hash as migration boundary** — Event/metric/journey definitions stay
   versioned in code. Warehouse schemas derive from the same config. Changing
   storage does not break consumers.

What **not** to do: try to store and query billions of raw rows inside Convex,
or grow unbounded actor-claim tables for every metric. Export, aggregate
externally, keep rollups lean.

This library can remain your **forever analytics SDK** if warehouse integration
is a planned backend concern — not a replacement product you switch to later.
