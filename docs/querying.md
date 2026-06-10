# Querying

All queries hit pre-aggregated rollup rows in `analyticsDailyMetrics` — not the
raw event log. This keeps reads fast regardless of how many raw events have been
tracked. Metrics default to **daily** buckets; metrics configured with `.hourly()`
use **hourly** buckets for time series and range totals.
In app-specific Convex functions, import your `analytics` object and call the
server helpers directly.

### Date ranges (UTC days)

All dashboard queries bucket on **UTC calendar days**, not rolling 24-hour
windows. Use the exported helpers instead of hand-rolling timestamps:

```ts
import {
	createAnalyticsCompletedDayRange,
	createAnalyticsTodayRange,
	analyticsDayRangeIncludesToday,
} from "@piton-/analytics-convex";

// Reporting dashboards: last 7 complete days, ending yesterday
const range = createAnalyticsCompletedDayRange(7);

// Live monitoring: today so far
const today = createAnalyticsTodayRange();

await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["featureUses"],
	...range,
	includeComparison: true,
});

if (analyticsDayRangeIncludesToday(today)) {
	// show "Today (in progress)" in the UI
}
```

Comparison queries use the previous period with the same number of UTC days and
**do not overlap** the current range. Prefer `createAnalyticsCompletedDayRange()`
for period-over-period cards; use `createAnalyticsTodayRange()` when you
explicitly want a live partial day.

Optional **`bucketUnit: "week" | "month"`** on `fetchTimeSeries` and
`fetchMetricComparison` re-aggregates daily (or hourly) rollups into calendar
weeks or months. Optional **`timezone`** (IANA name) groups buckets in a local
calendar; set `settings.defaultTimezone` in config to avoid passing it on every
query. Rollup **writes stay UTC** — timezone affects query grouping only.

```ts
await analytics.fetchTimeSeries(ctx, {
	metric: "orders",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 2, 31),
	bucketUnit: "month",
	timezone: "America/Los_Angeles",
});
```

> **Timezone precision:** daily-rollup metrics are stored per **UTC day**, so a
> timezone groups whole UTC days into local buckets — events within ±the zone
> offset of local midnight may land in the neighboring bucket. For exact local
> day boundaries, use `.hourly()` metrics (hour rollups re-bucket precisely).
> Also note `from`/`to` are interpreted in the query timezone: `Date.UTC(2026, 0, 1)`
> is still Dec 31 in `America/Los_Angeles` — pass instants inside the local
> period you want (e.g. add 12 hours).

### Time series

Bucketed chart data — **one point per UTC day** by default, or **one point per
UTC hour** when the metric uses `.hourly()`. Returns optional dimension grouping.

```ts
// Daily metric (default)
const daily = await analytics.fetchTimeSeries(ctx, {
	metric: "pageViews",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 0, 31),
	groupBy: "path",
});

// Hourly metric — use a short range (low-volume only)
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

Hourly rollups require `lowVolume` traffic mode and cannot use `distinctActors`.

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

// result.data: [{ key: "search", value: 523 }, { key: "export", value: 412 }, ...]
// result.meta.omittedSeriesCount: number of dimensions that didn't make the cut
```

### Metric comparison

Compares a metric between two equal-length periods. The previous period uses
`previousAnalyticsDayRange()` — same number of UTC days, **no overlap** with the
current range.

```ts
const result = await analytics.fetchMetricComparison(ctx, {
	metric: "pageViews",
	from: Date.UTC(2026, 5, 1), // June 1
	to: Date.UTC(2026, 5, 7), // June 7  (7 days)
});

// result: {
//   current: 1420,
//   previous: 1280,             // May 25 – May 31 automatically
//   delta: 140,                 // current - previous
//   deltaPercent: 10.94,        // undefined if previous is 0
//   range: { current: { from, to }, previous: { from, to } }
// }
```

### Metric conversion

Compute a rollup-based conversion rate between two metrics over the same range.
Use this for funnel steps such as scan → activation or reservation → confirmation.

```ts
const result = await analytics.fetchMetricConversion(ctx, {
	numeratorMetric: "guestActivations",
	denominatorMetric: "qrScans",
	from,
	to,
	scope: { type: "organization", id: ownerScopeId },
});

// result: {
//   numerator: 42,
//   denominator: 100,
//   ratePercent: 42,
//   range: { from, to },
//   scope,
// }
```

### Metric evaluation

Returns a dashboard health label for one metric. Labels are computed at query
time from rollup totals and the metric's `.evaluation()` config — they are not
stored in rollup tables.

```ts
guestActivations: count("Guest activations")
	.from("guest.activated")
	.evaluation({
		kind: "conversion",
		denominatorMetric: "qrScans",
		excellentRatePercent: 50,
		goodRatePercent: 20,
		badRatePercent: 10,
		minDenominator: 5,
	}),

newReservations: count("New reservations")
	.from("reservation.created")
	.evaluation({
		kind: "comparison",
		excellentGrowthPercent: 25,
		goodGrowthPercent: 5,
		badGrowthPercent: -5,
		minVolumeForComparison: 10,
	}),

cancelledReservations: count("Cancelled reservations")
	.from("reservation.cancelled")
	.evaluation({
		kind: "inverseRate",
		denominatorMetric: "newReservations",
		goodRatePercent: 10,
		badRatePercent: 25,
	}),

qrScans: count("QR scans")
	.from("qr.scanned")
	.evaluation({
		kind: "goal",
		targetValue: 500,
		excellentPercentOfGoal: 100,
		goodPercentOfGoal: 75,
		badPercentOfGoal: 50,
		minValueForEvaluation: 0,
	}),
```

**Evaluation kinds:**

| Kind | Answers | Key fields |
| ---- | ------- | ---------- |
| `comparison` | Did we grow vs last period? | `excellentGrowthPercent`, `goodGrowthPercent`, `badGrowthPercent` |
| `conversion` | What % converted? | `denominatorMetric`, rate percent thresholds |
| `inverseRate` | Is the rate low enough? | `denominatorMetric`, lower is better |
| `goal` | Did we hit the target for this range? | `targetValue`, percent-of-goal thresholds |

`targetValue` is the absolute goal for the **queried date range** (`from`–`to`). It is
not auto-prorated to calendar months in v1 — set the target for the window you query.

```ts
const result = await analytics.fetchMetricEvaluation(ctx, {
	metric: "guestActivations",
	from,
	to,
});

// result: {
//   value: 42,
//   evaluation: { label: "excellent", reason: "conversion_rate" },
//   conversion: {
//     numerator: 42,
//     denominator: 100,
//     ratePercent: 42,
//     denominatorMetric: "qrScans",
//   },
//   goal?: { targetValue, value, percentOfGoal? },
// }
```

Supported labels: `neutral`, `activity`, `good`, `excellent`, `bad`, `clear`.
(`activity` is not used for `goal` evaluation.)

Standard edge-case behavior:

| Case | Label |
|------|-------|
| `previous = 0`, `current > 0` | `activity` |
| `previous = 0`, `current = 0` | `neutral` |
| below `minVolumeForComparison` | `neutral` |
| conversion denominator below `minDenominator` | `neutral` |
| conversion denominator `0`, numerator `> 0` | `activity` |
| inverse rate `0%` | `clear` |
| goal `targetValue === 0` | `neutral` |
| goal `value === 0`, `targetValue > 0` | `bad` (when `0 <= badPercentOfGoal`) |
| goal below `minValueForEvaluation` | `neutral` |
| no `.evaluation()` config on metric | `neutral` |

For UI reuse outside Convex queries, import the pure helpers:

```ts
import {
	ANALYTICS_METRIC_LABELS,
	computePercentOfGoal,
	evaluateMetricLabel,
} from "@piton-/analytics-convex";

const label = evaluateMetricLabel({
	kind: "comparison",
	comparison: { current, previous, delta, deltaPercent },
	config: metric.evaluation,
});
```

### Migrating from app-side label logic

If your app currently does this manually:

- hardcoded growth thresholds on `fetchMetricComparison().deltaPercent`
- hand-rolled `numerator / denominator` funnel math
- badge labels like `Excellent` / `Bad` in frontend constants

Move thresholds into `.evaluation()` on each metric in `convex/analytics.ts`,
then replace custom logic with:

- `analytics.fetchMetricEvaluation(ctx, { metric, from, to, scope? })` for card
  labels
- `analytics.fetchDashboardMetrics(ctx, { metrics, from, to, scope?, includeComparison?, includeEvaluation? })`
  for full dashboard cards in one query
- `analytics.fetchMetricConversion(ctx, { numeratorMetric, denominatorMetric, from, to, scope? })`
  for funnel rates
- `analytics.fetchFunnelConversion(ctx, { funnel, from, to, scope? })` when the
  funnel is declared in `defineAnalytics({ funnels })`

Keep product-specific display strings in your UI if you want. The library owns
the math, guardrails, and label reasons via `evaluation.reason`.

### Dashboard batch reads

Load multiple dashboard cards in one rollup-optimized query instead of one
request per metric.

```ts
const dashboard = await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["qrScans", "guestActivations", "newReservations"],
	from,
	to,
	scope: { type: "organization", id: ownerScopeId },
	includeComparison: true,
	includeEvaluation: true,
});

// dashboard.metrics.guestActivations: {
//   value: 42,
//   label: "Guest activations",
//   unit: "count",
//   comparison?: { current, previous, delta, deltaPercent? },
//   evaluation?: { label, reason },
//   conversion?: { numerator, denominator, ratePercent, denominatorMetric },
//   goal?: { targetValue, value, percentOfGoal? },
// }
```

Rollup reads are deduped across metrics, comparison periods, and evaluation
denominators. Labels remain query-time only.

### Metric funnels (metric ratios)

> **Important:** `funnels` in config and `fetchFunnelConversion` are **metric
> ratios**, not user journeys. See [Journey funnels](#journey-funnels-event-sequences)
> for same-actor event sequences.

Define named metric funnels in `defineAnalytics`:

```ts
const analytics = defineAnalytics(components.analytics, {
	events,
	metrics,
	funnels: {
		guestActivation: {
			label: "Scan to activation",
			steps: ["qrScans", "guestActivations"],
		},
	},
});
```

```ts
const funnel = await analytics.fetchFunnelConversion(ctx, {
	funnel: "guestActivation",
	from,
	to,
});

// funnel: {
//   label: "Scan to activation",
//   steps: ["qrScans", "guestActivations"],
//   numeratorMetric: "guestActivations",
//   denominatorMetric: "qrScans",
//   numerator, denominator, ratePercent,
// }
```

Funnel steps must reference configured **metrics**. Each funnel needs at least
two unique steps. Conversion is always last step ÷ first step over the same range.
Pass optional **`groupBy`** (a dimension allowed on both funnel metrics) for
per-value conversion in `breakdown`.

```ts
const funnel = await analytics.fetchFunnelConversion(ctx, {
	funnel: "guestActivation",
	from,
	to,
	groupBy: "plan",
});
```

### Journey funnels (event sequences)

**User-journey funnels** track whether the **same actor** completed ordered
**event** steps. Steps may span multiple days — an actor can start a signup on
Monday and finish onboarding on Wednesday. Configure them separately from
metric funnels:

```ts
const analytics = defineAnalytics(components.analytics, {
	events,
	metrics,
	journeys: {
		checkout: {
			label: "Checkout journey",
			steps: ["checkout.started", "checkout.completed"],
			breakdownProperty: "plan",
		},
	},
});
```

Requirements and semantics:

- Each step is an **event name** (not a metric name)
- Events must include `actorId` when tracked — journeys dedupe by actor
- Steps must occur **in order**: step 2 only counts if the actor already
  completed step 1 on the same UTC day or an earlier one
- Step counts are distinct actors per step within the queried range. An actor
  whose earlier steps happened **before** the queried range still counts for
  later steps, so a step's rate can exceed 100% on narrow ranges — query a
  range that covers the whole journey window for clean funnels

```ts
const journey = await analytics.fetchJourneyConversion(ctx, {
	journey: "signup",
	from: Date.UTC(2026, 0, 10),
	to: Date.UTC(2026, 0, 10),
});

// journey: {
//   label: "Signup journey",
//   steps: ["signup.started", "signup.completed", "onboarding.finished"],
//   stepCounts: [100, 72, 41],       // distinct actors at each step
//   ratePercents: [null, 72, 41],   // step N ÷ step 1 (null for step 1)
//   scope, range,
// }
```

When the journey config sets `breakdownProperty`, pass `groupBy` (it must match
that property) to get per-value conversion rows. Each actor's cohort comes from
the property value on their **first step** event:

```ts
const journey = await analytics.fetchJourneyConversion(ctx, {
	journey: "checkout",
	from,
	to,
	groupBy: "plan",
});

// journey.breakdown: [
//   { dimensionValue: "pro", stepCounts: [60, 45], ratePercents: [null, 75] },
//   { dimensionValue: "free", stepCounts: [40, 12], ratePercents: [null, 30] },
// ]
```

Funnel and journey `breakdown` arrays are capped at `settings.maxBreakdownItems`
(largest first-step/denominator values first); top-level totals always cover the
full set.

Use metric funnels when you care about volume ratios. Use journey funnels when
you care about **conversion through a sequence** for the same user.

---
