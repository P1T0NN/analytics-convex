# Querying

All queries hit pre-aggregated rollup rows in `analyticsDailyMetrics`, not the
raw event log. This keeps reads fast regardless of how many raw events have
been tracked. Metrics default to daily buckets; metrics configured with
`.hourly()` use hourly buckets for time series and range totals.

In app-specific Convex functions, import your `analytics` object and call the
server helpers directly. Export functions from `analytics.client` only when the
browser or another public client should call them through Convex authorization.

For dashboard labels, goals, and per-scope overrides, see
[Evaluation](./evaluation.md). For metric funnels and same-actor journeys, see
[Funnels](./funnels.md). For pure helpers used around query results, see
[Utilities](./utils.md).

### Date ranges (UTC days)

All dashboard queries bucket on UTC calendar days, not rolling 24-hour windows.
Use the exported helpers instead of hand-rolling timestamps:

```ts
import {
	analyticsDayRangeIncludesToday,
	createAnalyticsCompletedDayRange,
	createAnalyticsTodayRange,
} from "@piton-/analytics-convex";

// Reporting dashboards: last 7 complete days, ending yesterday.
const range = createAnalyticsCompletedDayRange(7);

// Live monitoring: today so far.
const today = createAnalyticsTodayRange();

await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["featureUses"],
	...range,
	includeComparison: true,
});

if (analyticsDayRangeIncludesToday(today)) {
	// Show "Today (in progress)" in the UI.
}
```

Comparison queries use the previous period with the same number of UTC days and
do not overlap the current range. Prefer `createAnalyticsCompletedDayRange()`
for period-over-period cards. Use `createAnalyticsTodayRange()` when you
explicitly want a live partial day.

Optional `bucketUnit: "week" | "month"` on `fetchTimeSeries` and
`fetchMetricComparison` re-aggregates daily or hourly rollups into calendar
weeks or months. Optional `timezone` (IANA name) groups buckets in a local
calendar. Set `settings.defaultTimezone` in config to avoid passing it on every
query. Rollup writes stay UTC; timezone affects query grouping only.

```ts
await analytics.fetchTimeSeries(ctx, {
	metric: "orders",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 2, 31),
	bucketUnit: "month",
	timezone: "America/Los_Angeles",
});
```

Timezone precision: daily-rollup metrics are stored per UTC day, so a timezone
groups whole UTC days into local buckets. Events within the zone offset of
local midnight may land in the neighboring bucket. For exact local day
boundaries, use `.hourly()` metrics because hour rollups re-bucket precisely.
Also note `from` and `to` are interpreted in the query timezone:
`Date.UTC(2026, 0, 1)` is still Dec 31 in `America/Los_Angeles`, so pass
instants inside the local period you want.

### Time series

Bucketed chart data: one point per UTC day by default, or one point per UTC
hour when the metric uses `.hourly()`. Returns optional dimension grouping.

```ts
// Daily metric (default).
const daily = await analytics.fetchTimeSeries(ctx, {
	metric: "pageViews",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 0, 31),
	groupBy: "path",
});

// Hourly metric: use a short range.
const hourly = await analytics.fetchTimeSeries(ctx, {
	metric: "featureUsesHourly",
	from: Date.UTC(2026, 0, 15, 12),
	to: Date.UTC(2026, 0, 15, 18),
});
```

Define hourly metrics in config:

```ts
featureUsesHourly: count("Feature uses (hourly)")
	.from("feature.used")
	.hourly()
	.build("featureUsesHourly"),
```

Hourly rollups require `lowVolume` traffic mode and cannot use
`distinctActors`.

### Summary

Single aggregated total for a metric over a date range.

```ts
const result = await analytics.fetchSummary(ctx, {
	metric: "featureUses",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 0, 31),
	scope: { type: "global" },
});

// result: { metric, label, unit, scope, value: 1234, range: { from, to } }
```

Project-specific wrapper query:

```ts
// convex/accommodations.ts
import { query } from "./_generated/server";
import { analytics } from "./analytics";

export const fetchAccommodationsSummary = query({
	args: {},
	handler: async (ctx) => {
		return await analytics.fetchSummary(ctx, {
			metric: "featureUses",
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 0, 31),
			scope: { type: "organization", id: "org_abc" },
		});
	},
});
```

### Breakdown

Top dimension values ranked by total. Returns the highest-value keys for a
dimension.

```ts
const result = await analytics.fetchBreakdown(ctx, {
	metric: "featureUses",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 0, 31),
	groupBy: "feature",
});

// result.data: [{ key: "search", value: 523 }, { key: "export", value: 412 }]
// result.meta.omittedSeriesCount: number of dimensions that did not make the cut
```

Use [Advanced helpers](./advanced-helpers.md) for dimension totals as a `Map`
or the top dimension value.

### Metric comparison

Compares a metric between two equal-length periods. The previous period uses
`previousAnalyticsDayRange()`: same number of UTC days, no overlap with the
current range.

```ts
const result = await analytics.fetchMetricComparison(ctx, {
	metric: "pageViews",
	from: Date.UTC(2026, 5, 1), // June 1
	to: Date.UTC(2026, 5, 7), // June 7 (7 days)
});

// result: {
//   current: 1420,
//   previous: 1280,
//   delta: 140,
//   deltaPercent: 10.94, // undefined if previous is 0
//   range: { current: { from, to }, previous: { from, to } }
// }
```

### Metric conversion

Compute a rollup-based conversion rate between two metrics over the same range.
Use this for ad-hoc funnel steps such as scan to activation or reservation to
confirmation.

```ts
const result = await analytics.fetchMetricConversion(ctx, {
	numeratorMetric: "guestActivations",
	denominatorMetric: "qrScans",
	from,
	to,
	scope: { type: "organization", id: organizationId },
});

// result: {
//   numerator: 42,
//   denominator: 100,
//   ratePercent: 42,
//   range: { from, to },
//   scope,
// }
```

For named metric funnels and same-actor event journeys, see
[Funnels](./funnels.md).

### Metric evaluation

Use `fetchMetricEvaluation` for one evaluated dashboard card:

```ts
const result = await analytics.fetchMetricEvaluation(ctx, {
	metric: "guestActivations",
	from,
	to,
	scope: { type: "organization", id: organizationId },
});
```

Use `fetchDashboardMetrics` with `includeEvaluation: true` for multiple cards.
Evaluation config, labels, goal progress, sentiment, and overrides are covered
in [Evaluation](./evaluation.md).

### Dashboard batch reads

Load multiple dashboard cards in one rollup-optimized query instead of one
request per metric.

```ts
const dashboard = await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["qrScans", "guestActivations", "newReservations"],
	from,
	to,
	scope: { type: "organization", id: organizationId },
	includeComparison: true,
	includeEvaluation: true,
});

// dashboard.metrics.guestActivations: {
//   value: 42,
//   label: "Guest activations",
//   unit: "count",
//   comparison?: { current, previous, delta, deltaPercent? },
//   evaluation?: { label, reason, sentiment },
//   conversion?: { numerator, denominator, ratePercent, denominatorMetric },
//   goal?: { targetValue, value, percentOfGoal? },
// }
```

Rollup reads are deduped across metrics, comparison periods, evaluation
denominators, and per-scope overrides. Labels remain query-time only.

### Client wrappers

Everything on `analytics.client` is a registered Convex query or mutation. Use
these when the browser or public routes need direct access:

```ts
export const {
	timeSeries,
	summary,
	breakdown,
	metricComparison,
	metricConversion,
	metricEvaluation,
	metricEvaluationConfig,
	dashboardMetrics,
	funnelConversion,
	journeyConversion,
	metricTotalsByDimension,
	topDimensionValue,
} = analytics.client;
```

These wrappers run `authorize`. Plain helpers on the top-level `analytics`
object do not, so only call them from Convex functions that already enforce
auth.

---
