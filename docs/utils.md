# Utilities

Pure utilities are exported from `@piton-/analytics-convex`. They do not read
or write Convex data, so they are safe to use in UI components, tests, and app
helper modules.

Import from the package root, not from `src/shared/*`:

```ts
import {
	createAnalyticsCompletedDayRange,
	evaluateMetricLabel,
	isGoalEvaluationConfig,
	getAnalyticsRanking,
} from "@piton-/analytics-convex";
```

### Date ranges

Use the date range helpers for dashboard queries instead of hand-rolling
timestamps. Analytics rollups are written in UTC, and these helpers keep period
math consistent with query behavior.

```ts
import {
	analyticsDayRangeIncludesToday,
	createAnalyticsCompletedDayRange,
	createAnalyticsDayRange,
	createAnalyticsTodayRange,
	previousAnalyticsDayRange,
	previousAnalyticsPeriodRange,
} from "@piton-/analytics-convex";

// Last 7 complete UTC days, ending yesterday.
const reportingRange = createAnalyticsCompletedDayRange(7);

// Today so far, useful for live monitoring.
const today = createAnalyticsTodayRange();

// Flexible window for a picker.
const last30IncludingToday = createAnalyticsDayRange({
	days: 30,
	includeToday: true,
});

// Previous equal-length UTC day period for comparisons.
const previous = previousAnalyticsDayRange(reportingRange);

// Previous calendar period for week/month comparisons.
const previousMonth = previousAnalyticsPeriodRange(
	{
		from: Date.UTC(2026, 0, 1),
		to: Date.UTC(2026, 0, 31),
	},
	"month",
	"America/New_York",
);

if (analyticsDayRangeIncludesToday(today)) {
	// Show "in progress" UI copy.
}
```

Lower-level helpers are also exported for custom date pickers:
`getQueryBucketStart`, `listQueryBuckets`, `startOfUtcDay`, `startOfUtcWeek`,
`startOfUtcMonth`, `normalizeAnalyticsDayRange`, and `countUtcDaysInRange`.

For query semantics around UTC days, week/month buckets, and timezones, see
[Querying - Date ranges](./querying.md#date-ranges-utc-days).

### Evaluation helpers

Use `evaluateMetricLabel` when you need the same label math outside
`fetchMetricEvaluation`, for example in UI previews before saving a config.

```ts
import {
	computeConversionRatePercent,
	computePercentOfGoal,
	evaluateMetricLabel,
	metricLabelSentiment,
} from "@piton-/analytics-convex";

const ratePercent = computeConversionRatePercent({
	numerator: 42,
	denominator: 100,
});

const result = evaluateMetricLabel({
	kind: "conversion",
	conversion: {
		numerator: 42,
		denominator: 100,
		ratePercent,
	},
	config: {
		kind: "conversion",
		denominatorMetric: "qrScans",
		excellentRatePercent: 50,
		goodRatePercent: 20,
		badRatePercent: 10,
		minDenominator: 5,
	},
});

const badgeTone = metricLabelSentiment(result.label);

const percentOfGoal = computePercentOfGoal({
	value: 750,
	targetValue: 1_000,
});
```

`evaluateMetricLabel` returns `{ label, reason, sentiment }`. Use `label` for
the display text, `reason` for a tooltip or audit trail, and `sentiment` for
success/danger/muted color tokens.

### Goal config narrowing

`metricEvaluationConfig` returns an effective config:

- a per-scope override when one exists
- otherwise the static `.evaluation()` config
- otherwise `null`

Because the effective config can be `goal`, `comparison`, `conversion`, or
`inverseRate`, use `isGoalEvaluationConfig` before reading goal-only fields.

```tsx
import { isGoalEvaluationConfig } from "@piton-/analytics-convex";

const current = useQuery(api.analytics.metricEvaluationConfig, {
	metric: "qrScans",
	scope: { type: "organization", id: organizationId },
});

const goal = isGoalEvaluationConfig(current?.evaluation)
	? current.evaluation
	: null;

const targetValue = goal?.targetValue;
const hasOrgOverride = current?.source === "override" && goal !== null;
```

### Label constants

These constants are useful for legends, filters, and localization.

```ts
import {
	ANALYTICS_METRIC_LABEL_KEYS,
	ANALYTICS_METRIC_LABEL_SENTIMENTS,
	ANALYTICS_METRIC_LABELS,
} from "@piton-/analytics-convex";

const options = ANALYTICS_METRIC_LABEL_KEYS.map((label) => ({
	label,
	display: ANALYTICS_METRIC_LABELS[label],
	sentiment: ANALYTICS_METRIC_LABEL_SENTIMENTS[label],
}));
```

`ANALYTICS_METRIC_LABELS` contains default English display strings. Keep
product-specific copy and translations in your app.

### Scope helpers

Scope helpers keep resource scope IDs consistent between tracking and querying.

```ts
import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeId,
	createAnalyticsResourceScopeInput,
	createAnalyticsScopeId,
} from "@piton-/analytics-convex";

const ownerScopeId = createAnalyticsScopeId("hospitalityOwner", userId);

await analytics.track(ctx, "feature.used", {
	scopes: [
		createAnalyticsResourceScope("hospitalityOwner", userId),
	],
});

const dashboard = await analytics.fetchDashboardMetrics(ctx, {
	metrics: ["featureUses"],
	from,
	to,
	scope: createAnalyticsResourceScopeInput("hospitalityOwner", userId),
});

const storedResourceScopeId = createAnalyticsResourceScopeId(
	"hospitalityOwner",
	userId,
);
```

For choosing between global, organization, resource, and explicit scopes, see
[Scopes](./scopes.md).

### Ranking helpers

Use ranking helpers for UI leaderboards after fetching totals or breakdown
data.

```ts
import {
	compareScores,
	getAnalyticsRanking,
} from "@piton-/analytics-convex";

const top5 = getAnalyticsRanking({
	items: [...totals.entries()],
	getScore: ([, value]) => value,
	limit: 5,
	direction: "desc",
});

const ordered = [...totals.entries()].sort((a, b) =>
	compareScores("desc", a[1], b[1]),
);
```

Use `fetchMetricTotalsByDimension` or `fetchBreakdown` to get the data first;
ranking helpers only sort values already in memory.

---
