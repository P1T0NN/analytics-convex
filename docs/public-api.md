# Public API

Import everything your app needs from `@piton-/analytics-convex`. Do not import from
`src/shared/*`, `src/component/*`, or deep paths inside the package.

### Setup (once per project)

| Export | Use |
| ------ | --- |
| `defineAnalytics` | Create `convex/analytics.ts` — events, metrics, funnels, settings, `authorize` |
| `event`, `property`, `count`, `sum` | Define events and metrics |
| `registerAnalyticsCrons`, `createAnalyticsCronHandlers` | Cron wiring in `convex/crons.ts` |

`defineAnalytics` returns an `analytics` object with typed server helpers, optional
client wrappers, runtime `config`, and `registerCrons`.

### Server helpers (call inside Convex functions)

Use these on your `analytics` object. They pass runtime config to the component
automatically and **do not** run the `authorize` callback — your mutation/query must
already enforce auth.

| Method | Purpose |
| ------ | ------- |
| `writeTrack(ctx, input)` | Track one event or `{ events: [...] }` batch |
| `track(ctx, input)` | Alias for typed single/batch tracking |
| `fetchTimeSeries` | Daily chart data |
| `fetchSummary` | Single total over a range |
| `fetchBreakdown` | Top dimension values |
| `fetchMetricComparison` | Current vs previous period |
| `fetchMetricConversion` | Conversion rate between two metrics |
| `fetchMetricEvaluation` | One dashboard card with health label |
| `fetchDashboardMetrics` | Multiple dashboard cards in one query |
| `fetchFunnelConversion` | Named funnel (first step → last step) |
| `fetchMetricTotalsByDimension` | Dimension totals as `Map` |
| `fetchTopDimensionValue` | Top dimension value or `null` |
| `fetchConfiguration` | Read resolved runtime config |
| `config` | Same config object passed to crons and helpers |

### Client wrappers (optional — run `authorize`)

Export from `convex/analytics.ts` when the browser or a public route should call
analytics directly:

```ts
export const {
	writeTrack,
	fetchTimeSeries,
	fetchSummary,
	fetchDashboardMetrics,
} = analytics.client;
```

These wrapped functions **do** run your `authorize` callback.

### Utilities, constants, and types

| Export | Use |
| ------ | --- |
| `evaluateMetricLabel`, `computeConversionRatePercent`, `computePercentOfGoal` | Label math in UI (same rules as `fetchMetricEvaluation`) |
| `ANALYTICS_METRIC_LABELS` | Default display strings for labels |
| `getAnalyticsRanking`, `compareScores` | Sort/rank by score with tie-breakers |
| `createAnalyticsScopeId`, `createAnalyticsResourceScope`, `createAnalyticsResourceScopeId`, `createAnalyticsResourceScopeInput` | Build consistent scope IDs |
| `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, scope separator constants | Limits and enums |
| `types*` exports | TypeScript types — import from the package; do not copy into app code |
| Validators (`propertyValueValidator`, `scopeInputValidator`, …) | App-side Convex arg validation when needed |

Optional lower-level exports: `createAnalyticsApi`, `createAnalyticsReader`, and `createAnalyticsTracker` for custom wiring. Most apps only need `defineAnalytics`.

---
