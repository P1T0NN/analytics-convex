# Evaluation

Metric evaluation turns rollup totals into dashboard labels such as
`excellent`, `good`, `bad`, or `neutral`. Labels are computed at query time from
rollups and evaluation config. They are not stored in rollup rows.

Use evaluation for metric cards, goal progress, conversion health, and
period-over-period status. Use [Querying](./querying.md) for the raw read
methods and [Utilities](./utils.md) for pure UI-side helpers.

### Configure evaluation

Attach `.evaluation()` to a metric in `defineAnalytics`.

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

### Evaluation kinds

| Kind | Answers | Key fields |
| ---- | ------- | ---------- |
| `comparison` | Did this metric grow vs the previous period? | `excellentGrowthPercent`, `goodGrowthPercent`, `badGrowthPercent` |
| `conversion` | What percent converted? | `denominatorMetric`, rate thresholds |
| `inverseRate` | Is the rate low enough? | `denominatorMetric`; lower is better |
| `goal` | Did this range hit its target? | `targetValue`, percent-of-goal thresholds |

`targetValue` is the absolute goal for the queried date range (`from` to `to`).
It is not auto-prorated to calendar months in v1. Set the target for the window
you query.

### Fetch one evaluated metric

```ts
const result = await analytics.fetchMetricEvaluation(ctx, {
	metric: "guestActivations",
	from,
	to,
	scope: { type: "organization", id: organizationId },
});

// result: {
//   value: 42,
//   evaluation: {
//     label: "excellent",
//     reason: "conversion_rate",
//     sentiment: "positive",
//   },
//   conversion: {
//     numerator: 42,
//     denominator: 100,
//     ratePercent: 42,
//     denominatorMetric: "qrScans",
//   },
//   goal?: { targetValue, value, percentOfGoal? },
// }
```

Use `analytics.client.metricEvaluation` when the browser should call the query
directly through Convex. The client wrapper runs your `authorize` callback.

### Dashboard batches

`fetchDashboardMetrics` can evaluate many cards in one rollup-optimized query.

```ts
const dashboard = await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["qrScans", "guestActivations", "newReservations"],
	from,
	to,
	scope: { type: "organization", id: organizationId },
	includeComparison: true,
	includeEvaluation: true,
});

const qrScans = dashboard.metrics.qrScans;
```

Rollup reads are deduped across metrics, comparison periods, denominator
metrics, and per-scope overrides. Labels remain query-time only.

### Labels and sentiments

Supported labels: `neutral`, `activity`, `good`, `excellent`, `bad`, `clear`.
`activity` is not used for `goal` evaluation.

Every evaluation result includes:

| Field | Use |
| ----- | --- |
| `label` | Semantic label key for display text |
| `reason` | Why the label was chosen; useful for tooltips and debugging |
| `sentiment` | `positive`, `negative`, or `neutral` for color tokens |

Render badges from those fields instead of duplicating label logic in the UI.
If you need the same math outside Convex queries, use the pure helpers in
[Utilities - Evaluation helpers](./utils.md#evaluation-helpers).

### Edge cases

| Case | Label |
| ---- | ----- |
| `previous = 0`, `current > 0` | `activity` |
| `previous = 0`, `current = 0` | `neutral` |
| Below `minVolumeForComparison` | `neutral` |
| Conversion denominator below `minDenominator` | `neutral` |
| Conversion denominator `0`, numerator `> 0` | `activity` |
| Inverse rate `0%` | `clear` |
| Goal `targetValue === 0` | `neutral` |
| Goal `value === 0`, `targetValue > 0` | `bad` when `0 <= badPercentOfGoal` |
| Goal below `minValueForEvaluation` | `neutral` |
| No `.evaluation()` config on metric | `neutral` |

### Per-scope overrides

The `.evaluation()` config is the default for every scope. Each exact scope can
override it at runtime, which powers an "Edit goal" button on a metric card
where each customer sets their own target.

Expose the registered client functions from your analytics module:

```ts
export const {
	setMetricEvaluation,
	metricEvaluationConfig,
} = analytics.client;
```

From an edit dialog:

```ts
const current = useQuery(api.analytics.metricEvaluationConfig, {
	metric: "qrScans",
	scope: { type: "organization", id: organizationId },
});

// current: {
//   evaluation,
//   source: "override" | "config" | "none",
//   configEvaluation?
// }

await setMetricEvaluation({
	metric: "qrScans",
	scope: { type: "organization", id: organizationId },
	evaluation: {
		kind: "goal",
		targetValue: 1_000,
		excellentPercentOfGoal: 100,
		goodPercentOfGoal: 75,
		badPercentOfGoal: 50,
	},
});

// Reset to the static default.
await setMetricEvaluation({
	metric: "qrScans",
	scope: { type: "organization", id: organizationId },
	evaluation: null,
});
```

Overrides apply only to the exact scope they are written for. An organization
override never affects the global rollup or another organization.

`fetchMetricEvaluation` and `fetchDashboardMetrics` automatically use the
override for the queried scope.

### Goal config UI

`metricEvaluationConfig` returns the effective config:

- a per-scope override when one exists
- otherwise the static `.evaluation()` config
- otherwise `null`

Use `source` to tell whether an override exists. Use `isGoalEvaluationConfig`
before reading goal-only fields.

```tsx
import { isGoalEvaluationConfig } from "@piton-/analytics-convex";

const current = useQuery(api.analytics.metricEvaluationConfig, {
	metric: "qrScans",
	scope: { type: "organization", id: organizationId },
});

const goal = isGoalEvaluationConfig(current?.evaluation)
	? current.evaluation
	: null;

const hasOrgOverride = current?.source === "override" && goal !== null;
const targetValue = goal?.targetValue;
```

### Authorization

`setMetricEvaluation` is callable from the frontend, so gate it with
`authorize`. The operation is `{ type: "configureMetricEvaluation", metric,
scope }`.

```ts
authorize: async (ctx, operation) => {
	if (operation.type === "configureMetricEvaluation") {
		await assertCanManageOrganization(ctx, operation.scope);
	}
},
```

Read queries such as `metricEvaluation`, `metricEvaluationConfig`, and
`dashboardMetrics` use `{ type: "read", query, metric, metrics, scope }`.
See [Authorization](./authorization.md).

### Migrating from app-side label logic

If your app currently does this manually:

- hardcoded growth thresholds on `fetchMetricComparison().deltaPercent`
- hand-rolled `numerator / denominator` funnel math
- badge labels like `Excellent` / `Bad` in frontend constants

Move thresholds into `.evaluation()` on each metric in `convex/analytics.ts`,
then replace custom logic with:

- `analytics.fetchMetricEvaluation(ctx, { metric, from, to, scope? })` for card labels
- `analytics.fetchDashboardMetrics(ctx, { metrics, from, to, scope?, includeComparison?, includeEvaluation? })` for full dashboard cards
- `analytics.fetchMetricConversion(ctx, { numeratorMetric, denominatorMetric, from, to, scope? })` for ad-hoc funnel rates
- `analytics.fetchFunnelConversion(ctx, { funnel, from, to, scope? })` for named metric funnels

Keep product-specific display strings in your UI if you want. The library owns
the math, guardrails, and label reasons via `evaluation.reason`.

---
