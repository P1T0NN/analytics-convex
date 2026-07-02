# Changelog

## 1.1.0

### Added
- **Exact transactional state counters.** New `analytics.counters` server helpers — `bump(ctx, key, delta, opts?)`, `get(ctx, key)`, `getMany(ctx, keys)`, `set(ctx, key, value)` — backed by the new `analyticsCounters` component table. Counters answer "how many rows exist right now" (total guests, reservations per status) with O(1) indexed reads instead of full-table `.collect()` scans in reactive queries.
- **Exact by contract.** `bump`/`set` run inside the calling mutation's transaction, so counters never drift from table truth. Deltas may be negative; values are not clamped. Counters are deliberately never derived from tracked events — metrics stay approximate-by-contract, counters exact.
- **Optional sharding for hot keys.** `bump(ctx, key, delta, { shards: n })` spreads writes across shard rows when a single key exceeds roughly tens of writes/sec; reads always sum all shards, so mixed shard configs stay correct and `shards` can change at any time without migration. `set` collapses a key back to one shard-0 row for backfill/repair.
- Component functions `writeCounterBump`, `writeCounterSet`, `fetchCounter`, `fetchCounters` on `components.analytics.lib.*`.

### Documentation
- New `docs/counters.md`: state-vs-events distinction, transactionality guarantee, sharding ceiling and upgrade path, worked `guests` table example, and a counters-vs-metrics decision note.

## 1.0.1

### Added
- **Per-scope metric evaluation overrides.** Added runtime overrides for a metric's evaluation config by exact scope (`global`, `organization`, or `resource`) via the new `analyticsMetricEvaluationOverrides` component table. Overrides are resolved at query time and never mutate stored rollups.
- **Goal editing API.** Added `analytics.client.setMetricEvaluation` and `analytics.client.metricEvaluationConfig`, plus server helpers `analytics.setMetricEvaluation(ctx, ...)` and `analytics.fetchMetricEvaluationConfig(ctx, ...)`.
- **Effective evaluation config reads.** `metricEvaluationConfig` returns `{ metric, scope, evaluation, source, configEvaluation? }`, where `source` is `"override"`, `"config"`, or `"none"`. This supports edit dialogs that can show the current effective config and reset to the static default.
- **Evaluation authorization operation.** Client writes call `authorize` with `{ type: "configureMetricEvaluation", metric, scope }`, so apps can allow organization admins to edit only their own scoped goals.
- **Label sentiment metadata.** Metric evaluation results now include `sentiment: "positive" | "negative" | "neutral"` alongside `label` and `reason`, so UIs can map badges directly to color tokens.
- **Semantic label keys.** `ANALYTICS_METRIC_LABEL_KEYS` is now the source of truth for metric label keys, decoupled from default English display strings in `ANALYTICS_METRIC_LABELS`.
- **Evaluation UI helpers.** Added `metricLabelSentiment`, `ANALYTICS_METRIC_LABEL_SENTIMENTS`, and `isGoalEvaluationConfig` exports for frontend code that renders labels or branches on effective goal configs.

### Changed
- `fetchMetricEvaluation` and `fetchDashboardMetrics` now resolve the scoped evaluation config automatically. Scope overrides take precedence over static `.evaluation()` config; other scopes keep their own config.
- Static metric evaluation configs are now validated during `writeConfiguration`, not only when writing runtime overrides.
- Runtime evaluation override validation rejects unknown denominator metrics, non-finite numeric thresholds, and invalid goal targets.
- `analytics.client` now exposes `metricEvaluationConfig` and `setMetricEvaluation` as registered Convex functions safe to re-export from app Convex modules.

### Documentation
- Split the docs by concept for better human and LLM retrieval:
  - `docs/querying.md` for read methods and dashboard batches
  - `docs/evaluation.md` for labels, sentiments, goals, overrides, auth, and migration
  - `docs/funnels.md` for metric funnels vs same-actor journeys
  - `docs/utils.md` for pure helpers, labels, scopes, ranking, and date utilities
- Updated `public-api.md`, `api-reference.md`, `types.md`, `authorization.md`, `configuration.md`, `tracking.md`, `scale-and-limits.md`, and the LLM integration prompt in `architecture.md` to point to the new concept docs.
- Moved the deferred post-release roadmap from `docs/1.0.1-roadmap.md` to `docs/1.0.2-roadmap.md`.

### Migration notes
- Evaluation response objects now include the additive `sentiment` field. Consumers doing exact-object assertions on `evaluation` results must include the new field.
- Apps that expose `setMetricEvaluation` to the browser should update `authorize` to handle `operation.type === "configureMetricEvaluation"`.
- To clear an override, pass `evaluation: null`; this resets the scope to the static `.evaluation()` config if one exists. It does not necessarily mean "no evaluation".
- For goal edit UIs, read `metricEvaluationConfig` first and use `source === "override"` to distinguish a stored override from the static default.

## 1.0.0

### Added
- **Week / month query buckets** — optional `bucketUnit: "week" | "month"` on `fetchTimeSeries` and `fetchMetricComparison` (query-time re-aggregation from daily/hourly rollups).
- **Timezone-aware query buckets** — optional `timezone` on reads and `settings.defaultTimezone`; calendar week/month/day grouping at query time (writes stay UTC).
- **Journey breakdown by dimension** — `journeys.*.breakdownProperty` plus `groupBy` on `fetchJourneyConversion` for conversion by plan, region, etc.
- **Metric funnel breakdown by dimension** — optional `groupBy` on `fetchFunnelConversion`.
- Date helpers: `startOfUtcWeek`, `startOfUtcMonth`, `getQueryBucketStart`, `listQueryBuckets`, `previousAnalyticsPeriodRange`.
- Roadmap: `docs/1.0.2-roadmap.md` (dashboard features + export/backfill/journey-window infra).

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
