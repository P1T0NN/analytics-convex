# Changelog

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
