# Performance model

This page is the complete, truthful account of what analytics operations cost
in `@piton-/analytics-convex` — the storage tiers, the query planner, the
budgets, the exact row-count formulas, and the boundaries. If you are
evaluating whether an operation is safe, the answer is derivable from this
page.

## The guarantees

1. **No analytics query can hit a Convex transaction limit.** Every rollup and
   claim read inside a query draws from one shared per-query budget capped at
   `min(maxRollupRowsPerQuery, 12,288)` rows — 75% of Convex's 16,384
   documents-scanned limit. Reads are sequenced against that budget, so the
   bound holds across a whole dashboard batch, a funnel's two grouped reads,
   or a journey's per-step reads. If a query would exceed it, it throws the
   library's descriptive `QUERY_TOO_LARGE` — never a raw Convex error.
2. **No analytics mutation or cron can hit a Convex write limit.** Purge
   shares one delete budget (≤ 4,096) across its three tables; compaction
   bounds deletes + merges ≤ 6,000; the high-volume aggregator *plans* its
   merged writes first and halves the batch until the plan fits the write
   budget, deferring the remainder to the next self-scheduled batch.
3. **Read cost is decoupled from raw event volume.** Queries never touch
   `analyticsEvents`; the raw table's size is irrelevant to read cost.
4. **Read cost is decoupled from range length.** For every allowed range —
   1 day to the hard 366-day maximum — reads decompose into month-tier rows
   plus partial-edge day rows. A 366-day query costs about the same as a
   7-day one.
5. **No unbounded tables and no ghost data.** Every table is either purged by
   a cron, auto-pruned, explicitly prunable via the audit tools, or grows only
   with data you deliberately chose to keep (see the table below).

---

## Range policy

- **Maximum range: 366 days**, enforced as a hard ceiling
  (`ANALYTICS_LIMITS.maxQueryRangeDays`); settings cannot raise it, and
  `fetchMetricTotalsByDimension`'s `days` argument obeys the same cap.
- **No minimum range.** Today-only, 3 days, anything up to 366 days is valid.
  Short ranges are the cheapest queries in the system — a floor would save
  nothing.

---

## The mechanisms

### Rollups, never raw events

Every tracked event is aggregated at write time into `analyticsDailyMetrics`
rows keyed by `(metric, scope, granularity, dimensionKey, dimensionValue,
bucketStart, shard)`. Dashboard queries are indexed range scans over those
rows.

### Month tier + range decomposition

Day-granularity metrics write each event to the UTC day bucket **and** the UTC
month bucket — exact for every aggregation (`count`/`sum` add, `avg` carries
`sampleCount`, `min`/`max` merge). Totals, breakdowns, funnels, and UTC month
charts decompose a range into **[edge days] + [full months] + [edge days]**:

```
Jan 15 ─────────────────────────────► Dec 20
[Jan 15–31]  [Feb] [Mar] ... [Nov]  [Dec 1–20]
 17 day rows      10 month rows      20 day rows
```

≤ ~62 edge day rows + 12 month rows per series, at any range length. Partial
months always read day rows, never the month row — results are bit-identical
to summing day rows (tested).

### Month-tier actor claims (distinctActors)

Distinct counting cannot sum month totals — an actor active in two months
would double-count. Instead, the first event per actor per month writes a
**month claim** row alongside the per-day claim. Multi-day distinct reads
decompose exactly like totals do: month claims for full months, day claims for
the edges, and the union of actor keys is counted — **exact**, because
distinct counting is set-based.

Cost: roughly `edge-day active actors + Σ monthly-active actors` rows instead
of `active actors × days` — about a 30× reduction at 366 days. This keeps
long-range exact distinct counts inside the read budget for small-to-mid actor
counts (e.g. ~1,000 monthly actives × 12 months ≈ 12k rows ≈ the budget).
Beyond that, the query throws `QUERY_TOO_LARGE` rather than degrade —
exactness is the contract, and truly unbounded-scale unique counting requires
approximation (HLL), which this library deliberately does not silently do.

*Upgrading from 1.x with distinctActors metrics?* Run
`analytics.backfillMonthActorClaims(ctx)` once — it builds month claims from
historical day claims (paginated, self-scheduling, idempotent). Fresh installs
never need it.

### Shard compaction

Hot rollup rows are sharded (8/32 shards) to spread write contention, but a
closed bucket never sees another concurrent write. The
`compactAnalyticsRollups` cron collapses shard rows on buckets older than ~2
days into one shard-0 row, so the shard multiplier applies only to the last
~2–3 days and the current month's row. Idempotent, merge-correct for every
aggregation, safe with backdated writes.

---

## Cost formulas

Let `S` = shard count on recent (uncompacted) buckets, `V` = distinct
dimension values matched (1 for un-grouped), `A_m` = monthly-active actors.

| Query | Rows read (day-granularity metric) |
| --- | --- |
| `fetchSummary`, any range ≤ 366d | ≤ (62 + 12) × V, + S on ~2 recent days and the current month |
| `fetchMetricComparison` | 2 × summary cost |
| `fetchDashboardMetrics`, N metrics | N × summary cost (deduped, one shared budget) |
| `fetchBreakdown` / funnel `groupBy` / dimension totals | summary cost × V |
| `fetchTimeSeries`, `bucketUnit: "day"`/`"week"` | ≤ range days × V (+ S on recent days) |
| `fetchTimeSeries`, `bucketUnit: "month"`, UTC | decomposed — ≤ ~74 × V |
| distinctActors total, multi-day | edge-day actors + Σ A_m over full months |
| Journeys | step claims per actor per day, sequenced on the budget |
| Counters (`@piton-/analytics-convex/counters`) | O(log n) B-tree read |

Concrete example, default `mediumVolume` (8 shards), un-grouped summary:

| Range | Rows read |
| --- | ---: |
| today | ~8 |
| 7d | ~30 |
| 30d | ~50 |
| 90d | ~90 |
| 366d | ~110 |

Past the first ~2 months, each additional month adds **one row**. Every path
is bounded by the shared per-query budget; nothing reads unbounded data.

**Shapes that spend the budget fastest** (still safe — they throw the
library's error early rather than degrade): hourly metrics charted over many
months (~24 rows/day), grouped day/week charts over long ranges with many
dimension values (`days × V`), and exact distinct counts over long ranges at
large actor counts. Prefer `bucketUnit: "month"`, keep dimensions to tens of
values, and chart hourly metrics over short windows.

---

## Write cost (the trade)

Each event writes its day increment **and** its month increment per matching
metric, scope, and (total + each dimension); distinct metrics add one month
claim per actor per month. Batches merge increments per rollup row before
writing. The high-volume aggregator additionally *plans* its writes and
shrinks the batch if a pathological config (unique dimension values per event
across many scopes) would push a single mutation near the write limit —
throughput is preserved by self-scheduling, correctness by the bound.

If sustained ingest might outrun the drain, watch it:
`analytics.fetchIngestionHealth(ctx)` returns the pending backlog, per-cycle
drain capacity, and the oldest pending event's age — poll it from a dashboard
or alert cron. Drain capacity = `highVolumeBatchSize × (1 +
highVolumeMaxCatchupBatches)` per cron interval; raise those settings or
shorten the interval if `backlogExceedsCycle` is true.

---

## Data lifecycle — every table accounted for

| Table | Growth | Lifecycle |
| --- | --- | --- |
| `analyticsEvents` | per event | purged after `rawEventRetentionDays` (default 90) |
| `analyticsDailyMetrics` | per series × bucket | compacted by cron; purged by `rollupRetentionDays` if set |
| `analyticsDailyActorClaims` | per actor × day + per actor × month | purged with rollup retention (month rows once their month is fully stale) |
| `analyticsJourneyStepClaims` | per actor × step × day | purged with rollup retention |
| `analyticsConfigurations` | per config change | auto-pruned: stale rows (> 90 days, not active) deleted on the next `writeConfiguration` |
| `analyticsUniqueEvents` | per `unique.key` you track | **kept by contract** — each row *is* the once-ever guarantee you asked for; deleting one would allow a duplicate. Growth equals the number of things you chose to count once. Not ghost data. |
| `analyticsMetricEvaluationOverrides` | per explicit override | yours; clear with `setMetricEvaluation(..., null)` |

**Ghost data** — rows referencing metrics or journeys removed from your
config — is detected and removed explicitly:

```ts
// Admin-guarded query: O(distinct names) index seeks, never a table scan.
const audit = await analytics.fetchDataAudit(ctx);
// → { orphanedMetrics: ["oldMetricName"], orphanedJourneys: [], configurations: {...} }

// Deletes in budgeted, self-scheduling batches. Refuses names still in the
// config, so a mistake can never mass-delete live data.
await analytics.pruneData(ctx, { metrics: audit.orphanedMetrics });
```

Renamed a metric? The audit shows the old name the same day; one `pruneData`
call removes every row it left behind.

### Retention interplay (only if you enable `rollupRetentionDays`)

Day rows are purged past the cutoff; month rows and month claims are purged
only once their **entire month** is stale. In the window where a month is
partially purged, ranges covering that month in full still return the exact
original total (from the month row), while ranges cutting into it return only
surviving day rows. Queries reaching past your retention window are asking
about deleted data — keep `rollupRetentionDays` at 0 (default, keep forever)
or ≥ 366 to avoid the ambiguity entirely.

---

## Scope of these claims

- Timezone-aware queries (non-UTC) and `bucketUnit: "week"` use day rows —
  correct calendar math (DST-safe, tested), bounded by the budget, just not
  month-tier accelerated.
- This library is an in-Convex aggregation layer, not a warehouse. Ad-hoc SQL
  over unbounded raw history belongs in an export pipeline — see
  [Scale and limits](./scale-and-limits.md).
