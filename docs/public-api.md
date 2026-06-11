# Public API

Import everything your app needs from `@piton-/analytics-convex`. Do not import from
`src/shared/*`, `src/component/*`, or deep paths inside the package.

Test helpers live on a separate subpath: `@piton-/analytics-convex/testing`.
See [Testing](./testing.md).

### Setup (once per project)

| Export | Use |
| ------ | --- |
| `defineAnalytics` | Create `convex/analytics.ts` — events, metrics, funnels, journeys, settings, `authorize`, crons |
| `event`, `property` | Define events |
| `count`, `sum`, `avg`, `min`, `max`, `distinctActors` | Metric builders (chain `.from()`, `.by()`, `.hourly()`, `.actor()`, …) |

`defineAnalytics` returns one `analytics` object:

- **Server helpers** — call from your Convex functions (`track`, `writeTrack`, `fetchSummary`, …)
- **`analytics.client`** — registered Convex functions that run `authorize`; re-export them from a convex module
- **`analytics.crons`** — internal maintenance mutations to export from `convex/analytics.ts`
- **`analytics.registerCrons(crons, internalApi)`** — register high-volume and retention jobs
- **`analytics.config`** — runtime config (includes `configHash`)

### Server helpers (call inside Convex functions)

Use these on your `analytics` object. They pass runtime config to the component
automatically and **do not** run the `authorize` callback — your mutation/query must
already enforce auth.

| Method | Purpose |
| ------ | ------- |
| `track(ctx, "event.name", input)` | Typed tracking — name and properties are checked against your config |
| `track(ctx, input)` / `track(ctx, { events })` | Single object or batch form |
| `writeTrack(ctx, input)` | Untyped variant — one event object or `{ events: [...] }` |
| `fetchTimeSeries` | Daily or hourly chart data (per metric config) |
| `fetchSummary` | Single total over a range |
| `fetchBreakdown` | Top dimension values |
| `fetchMetricComparison` | Current vs previous period (non-overlapping UTC days) |
| `fetchMetricConversion` | Conversion rate between two metrics |
| `fetchMetricEvaluation` | One dashboard card with health label |
| `fetchMetricEvaluationConfig` | Effective evaluation config for a metric in a scope |
| `setMetricEvaluation` | Set/clear a per-scope evaluation override (`null` clears) |
| `fetchDashboardMetrics` | Multiple dashboard cards in one query |
| `fetchFunnelConversion` | Named **metric** funnel (first → last metric ratio) |
| `fetchJourneyConversion` | Named **event** journey (same-actor step sequence) |
| `fetchMetricTotalsByDimension` | Dimension totals as `Map` |
| `fetchTopDimensionValue` | Top dimension value or `null` |
| `fetchConfiguration` | Read resolved runtime config |
| `config` | Same config object passed to crons and helpers |

### Date range helpers

Exported from the main package for dashboard date pickers:

| Export | Use |
| ------ | --- |
| `createAnalyticsCompletedDayRange(days)` | Last N **complete** UTC days (ends yesterday) |
| `createAnalyticsTodayRange()` | Today only (live partial day) |
| `createAnalyticsDayRange({ days, includeToday? })` | Flexible UTC day window |
| `previousAnalyticsDayRange({ from, to })` | Previous period for comparisons |
| `analyticsDayRangeIncludesToday(range)` | UI hint for in-progress days |
| `previousAnalyticsPeriodRange(range, bucketUnit, timezone?)` | Previous period for week/month comparisons |
| `getQueryBucketStart`, `listQueryBuckets` | Resolve and enumerate day/week/month buckets (timezone-aware) |
| `startOfUtcDay`, `startOfUtcWeek`, `startOfUtcMonth`, `normalizeAnalyticsDayRange`, `countUtcDaysInRange` | Lower-level helpers |

See [Utilities - Date ranges](./utils.md#date-ranges) and
[Querying - Date ranges](./querying.md#date-ranges-utc-days).

### Client wrappers (optional — run `authorize`)

Everything on `analytics.client` is a **registered** Convex query or mutation.
Export the ones the browser or a public route should call directly:

```ts
export const {
	writeConfiguration,
	writeTrack,
	timeSeries,
	summary,
	breakdown,
	metricComparison,
	metricConversion,
	metricEvaluation,
	metricEvaluationConfig,
	setMetricEvaluation,
	dashboardMetrics,
	funnelConversion,
	journeyConversion,
	metricTotalsByDimension,
	topDimensionValue,
} = analytics.client;
```

These wrapped functions **do** run your `authorize` callback. Plain helpers
(`track`, `fetchSummary`, …) live on the top-level `analytics` object only —
they are not registered functions and cannot be exported as Convex endpoints.

### Utilities, constants, and types

| Export | Use |
| ------ | --- |
| `evaluateMetricLabel`, `computeConversionRatePercent`, `computePercentOfGoal` | Label math in UI (same rules as `fetchMetricEvaluation`) |
| `isGoalEvaluationConfig` | Narrow nullable/effective evaluation configs before reading goal fields |
| `metricLabelSentiment` | Map a label to `positive` / `negative` / `neutral` for color tokens |
| `ANALYTICS_METRIC_LABEL_KEYS` | All semantic label keys (legends, filters) |
| `ANALYTICS_METRIC_LABEL_SENTIMENTS` | Label → sentiment map |
| `ANALYTICS_METRIC_LABELS` | Default English display strings — localize in your UI |
| `getAnalyticsRanking`, `compareScores` | Sort/rank by score with tie-breakers |
| `createAnalyticsScopeId`, `createAnalyticsResourceScope`, … | Build consistent scope IDs |
| `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, scope separator constants | Limits and enums |
| `types*` exports | TypeScript types — import from the package; do not copy into app code |
| Validators (`propertyValueValidator`, `scopeInputValidator`, …) | App-side Convex arg validation when needed |

See [Utilities](./utils.md) for examples of the pure helper exports.
See [Evaluation](./evaluation.md) for labels, goals, and overrides. See
[Funnels](./funnels.md) for metric funnels and journeys.

### Testing subpath

| Import | Use |
| ------ | --- |
| `@piton-/analytics-convex/testing` | `createAnalyticsComponentTest`, `runtimeConfiguration`, `analyticsConfigArgs`, volume helpers |

Requires `convex-test` in app devDependencies. Not for production bundles.

---
