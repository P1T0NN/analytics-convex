# Types

Import types and constants from `@piton-/analytics-convex`. Do not copy type definitions
into consumer apps or import from `src/shared/types/*` directly.

`defineAnalytics()` gives you typed metric/event names on server helpers automatically.
Use the exports below for UI components, shared app utilities, and explicit annotations.

### Where types live in the library

| Location | Contents |
| -------- | -------- |
| `src/shared/constants.ts` | `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, `ANALYTICS_METRIC_LABEL_KEYS`, `ANALYTICS_METRIC_LABEL_SENTIMENTS`, `ANALYTICS_METRIC_LABELS`, scope separators, `DAY_MS`, … |
| `src/shared/types/primitives.ts` | Units, aggregations, property types |
| `src/shared/types/settings.ts` | `typesAnalyticsSettings` |
| `src/shared/types/scopes.ts` | Scope input, resolved scope, metric scopes |
| `src/shared/types/config.ts` | Event/metric/funnel/journey config (builder + `*Runtime` variants) |
| `src/shared/types/evaluation.ts` | Evaluation config, labels, comparison/conversion inputs |
| `src/shared/types/tracking.ts` | Track inputs, unique events, `typesWriteTrackResult` |
| `src/shared/types/queries.ts` | Query response shapes |
| `src/shared/types/queryArgs.ts` | Typed query argument helpers |
| `src/shared/types/operations.ts` | `typesAnalyticsOperation`, API options |
| `src/shared/types/ranking.ts` | Ranking utility types |
| `src/shared/types/typedTracking.ts` | Event-name–aware track generics |
| `src/shared/types/componentInternal.ts` | Component-only types (not exported from package entry) |

Builder config types use `readonly` arrays for literal inference. Runtime config uses
`*Runtime` variants with mutable arrays for Convex validators.

```ts
import type {
  // Tracking
  typesTrackEventInput,
  typesAnalyticsUnique,
  typesWriteTrackResult,

  // Config
  typesAnalyticsEventConfig,
  typesAnalyticsEventConfigRuntime,
  typesAnalyticsMetricConfig,
  typesAnalyticsMetricConfigRuntime,
  typesMetricEvaluationConfig,
  typesAnalyticsFunnelConfig,
  typesAnalyticsFunnelsConfig,
  typesAnalyticsJourneyConfig,
  typesAnalyticsJourneysConfig,
  typesAnalyticsRollupGranularity,
  typesAnalyticsBucketUnit,
  typesAnalyticsRuntimeConfig,
  typesAnalyticsScopeInput,
  typesAnalyticsResolvedScope,

  // Query args
  typesMetricRangeArgs,
  typesMetricComparisonArgs,
  typesMetricConversionArgs,
  typesMetricEvaluationArgs,
  typesDashboardMetricsArgs,
  typesFunnelConversionArgs,
  typesJourneyConversionArgs,

  // Query responses
  typesMetricSummaryResponse,
  typesMetricComparisonResponse,
  typesMetricConversionResponse,
  typesMetricEvaluationResponse,
  typesMetricEvaluationConfigResponse,
  typesDashboardMetricsResponse,
  typesFunnelConversionResponse,
  typesJourneyConversionResponse,

  // Evaluation helpers
  typesMetricEvaluationResult,
  typesMetricComparisonInput,
  typesAnalyticsMetricLabel,
  typesAnalyticsMetricSentiment,
  typesSetMetricEvaluationArgs,
  typesMetricEvaluationConfigArgs,
} from "@piton-/analytics-convex";
```

### Tracking

```ts
type typesTrackEventInput = {
  name: string;
  occurredAt?: number;
  actorId?: string;
  organizationId?: string;
  subject?: { type: string; id: string };
  scopes?: Array<{ scopeType: "global" | "organization" | "resource"; scopeId: string }>;
  properties?: Record<string, string | number | boolean | null>;
  source?: { type: "server" | "client" | "webhook" | "system"; name?: string };
  unique?: { key: string; scope?: "forever" };
};

type typesWriteTrackResult = {
  scheduled: boolean;
  scheduledCount: number;
  deduped?: boolean;
  dedupedCount?: number;
};
```

### Scopes

```ts
// Pass to queries
type typesAnalyticsScopeInput =
  | { type: "global"; id?: string }
  | { type: "organization"; id: string }
  | { type: "resource"; resourceType: string; id: string };

// Returned by queries
type typesAnalyticsResolvedScope =
  | { type: "global"; id: string }
  | { type: "organization"; id: string }
  | { type: "resource"; resourceType: string; resourceId: string; id: string };
```

### Metric evaluation config

```ts
type typesMetricEvaluationConfig =
  | {
      kind: "comparison";
      excellentGrowthPercent: number;
      goodGrowthPercent: number;
      badGrowthPercent: number;
      minVolumeForComparison?: number;
    }
  | {
      kind: "conversion";
      denominatorMetric: string;
      excellentRatePercent: number;
      goodRatePercent: number;
      badRatePercent: number;
      minDenominator?: number;
    }
  | {
      kind: "inverseRate";
      denominatorMetric: string;
      goodRatePercent: number;
      badRatePercent: number;
      minDenominator?: number;
    }
  | {
      kind: "goal";
      targetValue: number;
      excellentPercentOfGoal: number;
      goodPercentOfGoal: number;
      badPercentOfGoal: number;
      minValueForEvaluation?: number;
    };

type typesMetricEvaluationResult = {
  label: "neutral" | "activity" | "good" | "excellent" | "bad" | "clear";
  reason:
    | "no_evaluation_config"
    | "below_min_volume"
    | "below_min_denominator"
    | "zero_previous"
    | "zero_previous_and_current"
    | "zero_denominator_with_numerator"
    | "zero_denominator_and_numerator"
    | "zero_inverse_rate"
    | "comparison_growth"
    | "conversion_rate"
    | "inverse_rate"
    | "goal_progress"
    | "zero_target";
  sentiment: "positive" | "negative" | "neutral";
};

// Effective evaluation config for a metric in a scope
// (`analytics.fetchMetricEvaluationConfig` / `analytics.client.metricEvaluationConfig`)
type typesMetricEvaluationConfigResponse = {
  metric: string;
  scope: typesAnalyticsResolvedScope;
  evaluation: typesMetricEvaluationConfig | null;
  source: "override" | "config" | "none";
  configEvaluation?: typesMetricEvaluationConfig;
};
```

Use `isGoalEvaluationConfig(evaluation)` to narrow
`typesMetricEvaluationConfig | null | undefined` before reading
`targetValue`, `excellentPercentOfGoal`, or other goal-only fields.
See [Evaluation](./evaluation.md) for behavior and query examples.

### Funnel config

```ts
type typesAnalyticsFunnelConfig = {
  label: string;
  steps: string[];
};

type typesAnalyticsFunnelsConfig = Record<string, typesAnalyticsFunnelConfig>;
```

See [Funnels](./funnels.md) for metric funnel and journey semantics.

### Query args (common shapes)

Most query args share `from`, `to`, and optional `scope`:

```ts
type typesMetricRangeArgs = {
  metric: string;
  from: number;
  to: number;
  scope?: typesAnalyticsScopeInput;
};

type typesMetricConversionArgs = {
  numeratorMetric: string;
  denominatorMetric: string;
  from: number;
  to: number;
  scope?: typesAnalyticsScopeInput;
};

type typesDashboardMetricsArgs = {
  metrics: string[];
  from: number;
  to: number;
  scope?: typesAnalyticsScopeInput;
  includeComparison?: boolean;
  includeEvaluation?: boolean;
};

type typesFunnelConversionArgs = {
  funnel: string;
  from: number;
  to: number;
  scope?: typesAnalyticsScopeInput;
};
```

When using `defineAnalytics`, generic arg types such as
`typesDashboardMetricsArgs<typeof metrics>` narrow metric and funnel names to your
config.

---
