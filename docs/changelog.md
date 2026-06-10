# Changelog

## Unreleased

### Added
- **Week / month query buckets** — optional `bucketUnit: "week" | "month"` on `fetchTimeSeries` and `fetchMetricComparison` (query-time re-aggregation from daily/hourly rollups).
- **Timezone-aware query buckets** — optional `timezone` on reads and `settings.defaultTimezone`; calendar week/month/day grouping at query time (writes stay UTC).
- **Journey breakdown by dimension** — `journeys.*.breakdownProperty` plus `groupBy` on `fetchJourneyConversion` for conversion by plan, region, etc.
- **Metric funnel breakdown by dimension** — optional `groupBy` on `fetchFunnelConversion`.
- Date helpers: `startOfUtcWeek`, `startOfUtcMonth`, `getQueryBucketStart`, `listQueryBuckets`, `previousAnalyticsPeriodRange`.
- Roadmap: `docs/1.0.1-roadmap.md` (dashboard features + export/backfill/journey-window infra).

### Fixed (timezone/bucket review pass)
- **Rewrote timezone math on a correct offset-based algorithm.** The previous hourly-probe implementation threw for every timezone with a 30/45-minute offset (India, Nepal, Sri Lanka, Myanmar, parts of Australia) and on DST transitions that skip local midnight (Chile, Cuba); month starts and `addTimeZoneMonths` were off by one day/month for all UTC-negative zones (the entire Americas). Now covered by 12 dedicated tests plus a component regression test.
- **Day/week bucket iteration is DST-safe.** `listQueryBuckets` used fixed 24h/7d strides, which drift off local midnight across DST transitions and silently dropped chart points; buckets are now re-derived per step (`nextTimeZoneDayStart`/`nextTimeZoneWeekStart`).
- **`settings.defaultTimezone` is validated at configure time** and invalid query `timezone` values raise `BAD_REQUEST` ConvexErrors instead of generic errors.
- **Funnel `groupBy` with `distinctActors` step metrics** now dedupes via actor claims over multi-day ranges instead of summing per-day counts.
- **Funnel and journey breakdowns are capped at `maxBreakdownItems`** (totals still computed from the full set), so a high-cardinality dimension can't blow up the response.
- **Journey `breakdownProperty` rejects high-cardinality names** (userId, sessionId, …) at configure time, same as metric dimensions.
- Cached `Intl.DateTimeFormat` instances and memoized bucket-start lookups so timezone re-bucketing stays cheap on large row sets.

### Fixed
- **Identical events in one batch are no longer silently collapsed.** Idempotency keys now include the event's position in the batch, so tracking the same payload twice in one call counts twice. Replayed calls still dedupe.
- **Hourly metrics now return data from every read path.** `fetchDashboardMetrics`, `fetchMetricEvaluation`, `fetchBreakdown`, `fetchMetricTotalsByDimension`, and `fetchTopDimensionValue` previously only read daily rollup rows and returned 0/empty for `.hourly()` metrics.
- **`distinctActors` metrics no longer overcount in dashboard reads.** Multi-day ranges in `fetchDashboardMetrics` and `fetchMetricEvaluation` now dedupe via actor claims instead of summing per-day counts.
- **`fetchTopDimensionValue` ranks by the metric's real aggregation** (avg/min/max/distinctActors) instead of always summing.
- **`fetchConfiguration` now includes `journeys`** in its response.
- **Journeys convert across days.** Step N now matches a prior step claim from the same day *or any earlier day* (previously the whole journey had to complete within one UTC day). Steps arriving in one batch are claimed in step order, fixing a race that could drop conversions.
- **Config registration can no longer be skipped by the in-process cache**, which could lose scheduled events in a fresh isolate when only `configHash` was passed.

### Changed
- **`analytics.client` now contains only registered Convex functions** (`writeTrack`, `timeSeries`, `summary`, `breakdown`, `metricComparison`, `metricConversion`, `metricEvaluation`, `dashboardMetrics`, `funnelConversion`, `journeyConversion`, `metricTotalsByDimension`, `topDimensionValue`, `writeConfiguration`). Plain helpers (`track`, `fetchSummary`, …) moved exclusively to the top-level `analytics` object; `client.configure` was removed (use `client.writeConfiguration`).
- Added registered client queries: `journeyConversion`, `metricTotalsByDimension`, `topDimensionValue` (with matching `authorize` operation names).
- Typed `analytics.track(ctx, "event.name", input)` is now available at the top level of the `defineAnalytics()` result.
- Retention crons self-reschedule (up to 20 catch-up batches per tick) when a full batch was purged, so retention keeps up with high write volume. Purge mutations now return `scheduledNextBatch`.
- Config hashes upgraded to a 64-bit format (`v2:`). Existing deployments re-register their configuration transparently on the next call.
- Added schema index `analyticsJourneyStepClaims.by_journey_scope_actor_step_bucket` for cross-day journey ordering.

### Cleanup
- Removed all internal re-export barrel files (`shared/types/index.ts`, component `dateUtils`, `configurationHash`, `compareScores`, `listDailyBuckets`, `listRollupBuckets`, `getAnalyticsRanking`, `createServerWrappers`); modules now import from defining files.
- Removed dead code: single-event aggregation path, `createAnalyticsReader` (duplicate of server helpers), unused helpers and aliases.
- Remove unused component `http.ts` stub.

### Documentation
- Add `docs/scale-and-limits.md` — traffic bands, rollup growth, dimension footguns, funnel semantics.
- Funnel callout in querying guide; rollup retention documented in production guide.
- Docs updated for the new `analytics.client` surface, cross-day journeys, and idempotency semantics.
- Run `test:volume` in CI.

## 0.1.27

### Breaking
- Removed public exports: `createAnalyticsApi`, `createAnalyticsReader`, `createAnalyticsTracker`, `registerAnalyticsCrons`, and `createAnalyticsCronHandlers`. Use `defineAnalytics()` only.
- Removed public types: `typesCreateAnalyticsApiOptions`, `typesCreateAnalyticsApiOptionsForConfig`.

### DX
- `defineAnalytics()` now returns `crons` — export `analytics.crons` handlers and pass `internal.analytics` to `registerCrons()`.

## 0.1.26

### Performance
- Store runtime config in `analyticsConfigurations` keyed by hash; scheduled jobs and crons pass `configHash` only.
- Memoize normalized config in-process by hash.
- Parallelize unique-key claims in `writeTrack`, idempotency/unique lookups in batch writes, and rollup increment writes.
- Coalesce adjacent metric range reads (dashboard, comparison, evaluation) into single rollup scans per metric.

### DX
- Component APIs accept `{ configHash, config? }` instead of requiring full config on every call.
- `writeConfiguration` registers config and returns `{ configHash }`.
- Component `writeTrack` and `internalWriteAnalyticsEvent` accept `events` batches only.
- `createAnalyticsApi` uses typed response validators instead of `v.any()`.
- `createAnalyticsCronHandlers()` factory for maintenance cron wrappers.
- Removed legacy exports (`setupAnalytics`, `trackAnalytics*`, `configureAnalytics`, dimension/total aliases). Use `defineAnalytics()` only.
- Consistent `ConvexError` codes for validation failures.

### Schema
- Added `analyticsConfigurations` table.
- Removed unused `analyticsDailyMetrics.updatedAt` and `analyticsUniqueEvents.expiresAt` (+ index).

### Migration
- Pass `configHash` (+ optional `config` on first call) to component functions.
- Wrap single-event `writeTrack` calls as `events: [{ name, ... }]`.
- Cron registrations pass `{ configHash }` — use `createAnalyticsCronHandlers()`.

## 0.1.25

- Add `goal` metric evaluation kind — compare rollup totals against a fixed
  `targetValue` for the queried date range.
- Export `computePercentOfGoal` from `@piton-/analytics-convex`.
- Extend `fetchMetricEvaluation` and `fetchDashboardMetrics` responses with an
  optional `goal` block (`targetValue`, `value`, `percentOfGoal`).

## 0.0.0

- Initial release.
