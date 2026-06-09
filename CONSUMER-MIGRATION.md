# Consumer migration guide — `@piton-/analytics-convex`

Use this document when refactoring consumer apps (e.g. MisaIOgi) to adopt the latest
analytics library features. Paste it into your app repo or LLM session as context.

**Package:** `@piton-/analytics-convex`  
**Target version:** `0.1.22+` (or latest published after metric evaluation / dashboard / funnel work)  
**Note:** `0.1.21` added event-level `unique.key`. This guide covers that plus metric
evaluation, batch dashboard reads, and named funnels.

---

## Summary of new capabilities

| Feature | Purpose | Replace in app |
| -------- | -------- | -------------- |
| `unique.key` on `writeTrack` | Count an action once forever (analytics-level) | Custom “already tracked” checks before tracking |
| `.evaluation()` on metrics | Threshold rules for dashboard badges | Hardcoded growth/conversion thresholds in frontend or queries |
| `fetchMetricConversion` | Rollup-based rate between two metrics | Manual `numerator / denominator` |
| `fetchMetricEvaluation` | Value + label + comparison/conversion for one card | Custom badge logic + `fetchMetricComparison` + manual math |
| `fetchDashboardMetrics` | Multiple cards in one optimized query | N × `fetchSummary` / `fetchMetricEvaluation` loops |
| `funnels` + `fetchFunnelConversion` | Named first→last step conversion | Hardcoded funnel metric pairs in app code |
| `goal` evaluation kind | Absolute target vs rollup total for range | App-side presence/volume threshold logic |

**Unchanged:** idempotency (retry-safe same payload), rollup-only dashboard reads, scopes,
traffic modes, time series, breakdown, dimension helpers.

**Still NOT in library:** `distinctCount` / unique actors per metric. Use product tables for
true distinct-user semantics.

---

## 1. Product-level uniqueness — `unique.key`

**Problem:** Idempotency only dedupes identical retries (same ms + same payload). It does not
mean “count this user action once ever.”

**Solution:** Pass `unique` when tracking:

```ts
await analytics.writeTrack(ctx, {
  name: "guest.activated",
  actorId: userId,
  organizationId: orgId,
  unique: { key: `guest-activation:${orgId}:${guestId}` },
  // scope: optional — unique key is global unless you embed scope in the key
});
```

**Shape:**

```ts
unique?: {
  key: string;           // max 512 chars
  scope?: "forever";     // only supported scope today
}
```

**Return when deduped:**

```ts
{
  scheduled: false,
  scheduledCount: 0,
  deduped: true,
  dedupedCount: 1,
}
```

**Rules for refactor:**

- Remove app-side “if already tracked, skip analytics” when the goal is **analytics
  counting only**.
- Keep your own product ledger tables when uniqueness is **business state** (coupon issued,
  reward granted, permission gating).
- Dashboard reads unchanged — deduped events never touch rollups.

**Storage:** New component table `analyticsUniqueEvents` (indexed by key and expiry).

---

## 2. Metric evaluation config — `.evaluation()` on metric builder

Add threshold rules **next to metric definitions** in `convex/analytics.ts` (via
`defineAnalytics`):

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
    goodRatePercent: 10,   // at or below = good
    badRatePercent: 25,    // at or above = bad
  }),
```

### Evaluation kinds

| Kind | Use case | Key fields |
| ---- | -------- | ---------- |
| `comparison` | Period-over-period growth | `excellentGrowthPercent`, `goodGrowthPercent`, `badGrowthPercent`, optional `minVolumeForComparison` |
| `conversion` | Higher rate is better | `denominatorMetric`, `excellentRatePercent`, `goodRatePercent`, `badRatePercent`, optional `minDenominator` |
| `inverseRate` | Lower rate is better (cancellations, churn) | `denominatorMetric`, `goodRatePercent`, `badRatePercent`, optional `minDenominator` |
| `goal` | Hit an absolute target for the queried range | `targetValue`, `excellentPercentOfGoal`, `goodPercentOfGoal`, `badPercentOfGoal`, optional `minValueForEvaluation` |

`targetValue` is the goal for the **`from`–`to` window** you query — not auto-prorated
to calendar months in v1.

### Labels and reasons

**Labels:** `neutral` | `activity` | `good` | `excellent` | `bad` | `clear`

**Reasons (examples):** `conversion_rate`, `comparison_growth`, `inverse_rate`,
`goal_progress`, `zero_target`, `below_min_volume`, `below_min_denominator`,
`zero_previous`, `zero_previous_and_current`, `zero_denominator_with_numerator`,
`no_evaluation_config`, etc.

Labels are **computed at query time from rollups** — never stored in DB.

### Standard edge-case behavior

| Case | Label |
| ---- | ----- |
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

**Refactor:** Move threshold constants from frontend/backend into `.evaluation()`. UI may
still override display strings; library owns math + edge cases.

### Goal evaluation — absolute targets (`kind: "goal"`) — v0.1.25+

Use when a dashboard card should compare the metric total for a date range against a
**fixed target**, not period growth or conversion rate.

**Before (app-side presence label):**

```ts
// convex/analytics.ts — no evaluation on qrScans
qrScans: count("QR scans").from("qr.scanned").by("accommodationId", "scanType"),

// UI: custom getPresenceAnalyticsLabel(value) → activity/neutral only
```

**After (goal in library):**

```ts
qrScans: count("QR scans")
  .from("qr.scanned")
  .by("accommodationId", "scanType")
  .evaluation({
    kind: "goal",
    targetValue: 1000,
    excellentPercentOfGoal: 100,
    goodPercentOfGoal: 80,
    badPercentOfGoal: 50,
  }),
```

```ts
// UI: dashboard.metrics.qrScans.evaluation.label from fetchDashboardMetrics
// Optional: dashboard.metrics.qrScans.goal?.percentOfGoal
```

Pure UI helper (same rules as queries):

```ts
import { computePercentOfGoal, evaluateMetricLabel } from "@piton-/analytics-convex";
```

---

## 3. New read queries

All reads use **`analyticsDailyMetrics` rollups only** — same `from`, `to`, `scope?` pattern
as existing queries.

### `fetchMetricConversion`

Rollup rate between any two metrics:

```ts
const result = await analytics.fetchMetricConversion(ctx, {
  numeratorMetric: "guestActivations",
  denominatorMetric: "qrScans",
  from,
  to,
  scope: { type: "organization", id: orgId },
});

// {
//   numeratorMetric, denominatorMetric,
//   numerator, denominator, ratePercent,
//   range: { from, to }, scope,
// }
```

**Wrapped client query:** `metricConversion`

---

### `fetchMetricEvaluation`

Single dashboard card with value + optional comparison + conversion + label:

```ts
const result = await analytics.fetchMetricEvaluation(ctx, {
  metric: "guestActivations",
  from,
  to,
  scope,
});

// {
//   metric, label, unit, value, range, scope,
//   evaluation: { label: "excellent", reason: "conversion_rate" },
//   comparison?: { current, previous, delta, deltaPercent? },
//   conversion?: { numerator, denominator, ratePercent, denominatorMetric },
//   goal?: { targetValue, value, percentOfGoal? },
// }
```

**Wrapped client query:** `metricEvaluation`

**Refactor:** Replace custom badge logic that combines `fetchSummary` +
`fetchMetricComparison` + manual threshold checks.

---

### `fetchDashboardMetrics` (batch — prefer for full dashboards)

One query with deduped rollup reads:

```ts
const dashboard = await analytics.fetchDashboardMetrics(ctx, {
  metrics: [
    "qrScans",
    "guestActivations",
    "newReservations",
    "cancelledReservations",
  ],
  from,
  to,
  scope: { type: "organization", id: ownerScopeId },
  includeComparison: true,   // period-over-period for every metric
  includeEvaluation: true,     // run .evaluation() rules per metric
});

// {
//   scope,
//   range: { from, to },
//   metrics: {
//     guestActivations: {
//       value,
//       label,
//       unit,
//       comparison?: { current, previous, delta, deltaPercent? },
//       evaluation?: { label, reason },
//       conversion?: { numerator, denominator, ratePercent, denominatorMetric },
//     },
//     ...
//   },
// }
```

**Limits:** max **24 metrics** per request; duplicate metric names are rejected.

**Wrapped client query:** `dashboardMetrics`

**Refactor:** Replace loops of `fetchMetricEvaluation` / `fetchSummary` per card with one
`fetchDashboardMetrics` call in dashboard page loaders.

---

### Named funnels — `funnels` in `defineAnalytics` + `fetchFunnelConversion`

Declare funnels in analytics config:

```ts
const analytics = defineAnalytics(components.analytics, {
  events,
  metrics,
  funnels: {
    guestActivation: {
      label: "Scan to activation",
      steps: ["qrScans", "guestActivations"],
    },
    reservationFlow: {
      label: "Activation to reservation",
      steps: ["guestActivations", "newReservations"],
    },
    scanToConfirmed: {
      label: "Scan to confirmed reservation",
      steps: [
        "qrScans",
        "guestActivations",
        "hospitalityViews",
        "newReservations",
        "confirmedReservations",
      ],
    },
  },
});
```

**Rules:**

- Min **2** steps per funnel; max **10**
- Steps must be registered metric names; no duplicates within a funnel
- Conversion = **last step ÷ first step** over the same date range (not step-by-step)

```ts
const funnel = await analytics.fetchFunnelConversion(ctx, {
  funnel: "guestActivation",
  from,
  to,
  scope,
});

// {
//   funnel, label, steps,
//   numeratorMetric, denominatorMetric,
//   numerator, denominator, ratePercent,
//   range, scope,
// }
```

**Wrapped client query:** `funnelConversion` (typed to configured funnel names when using
`defineAnalytics`)

**Refactor:** Replace hardcoded `{ numerator: "guestActivations", denominator: "qrScans" }`
pairs with funnel names.

---

## 4. Pure exports (usable in frontend without Convex)

```ts
import {
  ANALYTICS_METRIC_LABELS,      // default display map for labels
  evaluateMetricLabel,          // pure label evaluator
  computeConversionRatePercent, // numerator/denominator → ratePercent
} from "@piton-/analytics-convex";
```

Use when you already have numbers client-side and only need label logic. Prefer server
queries for dashboard data.

**Example (UI-only reuse):**

```ts
const label = evaluateMetricLabel({
  kind: "comparison",
  comparison: { current, previous, delta, deltaPercent },
  config: metric.evaluation,
});
```

---

## 5. Authorization callback — new operation types

If you use `authorize` in `defineAnalytics`, handle new read operations:

```ts
| { type: "read"; query: "metricConversion"; metric?: string; scope? }
| { type: "read"; query: "metricEvaluation"; metric?: string; scope? }
| { type: "read"; query: "dashboardMetrics"; metrics?: string[]; scope? }
| { type: "read"; query: "funnelConversion"; funnel?: string; scope? }
```

---

## 6. Consumer app refactor checklist

### In `convex/analytics.ts`

1. Add `.evaluation()` to dashboard metrics (`guestActivations`, `newReservations`,
   `cancelledReservations`, etc.).
2. Add `funnels` for common flows (scan→activation, activation→reservation, etc.).
3. Use `unique.key` on events that should only increment analytics once per guest/org/action.

### In dashboard queries / loaders

4. Replace per-metric query loops → **`fetchDashboardMetrics`** with
   `includeComparison: true`, `includeEvaluation: true`.
5. Replace manual funnel math → **`fetchFunnelConversion({ funnel: "..." })`** or keep
   **`fetchMetricConversion`** for ad-hoc pairs not in config.

### In frontend

6. Delete hardcoded threshold constants and badge classifiers that duplicate library logic.
7. Map `evaluation.label` → UI styling; optionally use `ANALYTICS_METRIC_LABELS[label]` for
   default copy.
8. Use `evaluation.reason` for debugging/tooltips, not primary UX copy.

### Delete / stop maintaining

- Custom `deltaPercent` threshold functions on `fetchMetricComparison` results
- Hand-rolled `numerator / denominator * 100` for funnel cards
- Multiple sequential `ctx.runQuery` calls per dashboard page when one batch suffices
- Analytics-only “already counted” guards superseded by `unique.key`

---

## 7. Architecture constraints (do not break)

- Dashboard reads → rollups only (`analyticsDailyMetrics`), never raw events
- Labels → query-time only, not stored in rollups
- `unique.key` → analytics dedup, not product permissions
- Funnel conversion → first step vs last step only (not pairwise step rates)
- Scopes: prefer `organizationId` on track + matching `scope` on queries; see README Scopes
  section

---

## 8. New limits (`ANALYTICS_LIMITS`)

| Limit | Value |
| ----- | ----: |
| Unique event key length | 512 chars |
| Funnels per configuration | 50 |
| Steps per funnel | 10 |
| Metrics per dashboard batch query | 24 |

---

## 9. Full API surface added

### Component (`components.analytics.lib.*`)

- `fetchMetricConversion`
- `fetchMetricEvaluation`
- `fetchDashboardMetrics`
- `fetchFunnelConversion`

### Server helpers (`defineAnalytics` / `createAnalyticsServerHelpers`)

- `fetchMetricConversion`
- `fetchMetricEvaluation`
- `fetchDashboardMetrics`
- `fetchFunnelConversion`

### Wrapped client queries (`defineAnalytics().client`)

- `metricConversion`
- `metricEvaluation`
- `dashboardMetrics`
- `funnelConversion`

### Config extensions

- `metrics[].evaluation?: MetricEvaluationConfig`
- `funnels?: Record<string, { label: string; steps: string[] }>`

### Tracking extensions

- `unique?: { key: string; scope?: "forever" }`
- `writeTrack` return may include `deduped`, `dedupedCount`

---

## 10. Example: before → after (dashboard page)

### Before (anti-pattern)

```ts
const qrScans = await analytics.fetchSummary(ctx, {
  metric: "qrScans",
  from,
  to,
  scope,
});
const activations = await analytics.fetchSummary(ctx, {
  metric: "guestActivations",
  from,
  to,
  scope,
});
const comparison = await analytics.fetchMetricComparison(ctx, {
  metric: "newReservations",
  from,
  to,
  scope,
});
// + custom functions: getActivationRate(), getBadgeLabel(), etc.
```

### After

```ts
const dashboard = await analytics.fetchDashboardMetrics(ctx, {
  metrics: [
    "qrScans",
    "guestActivations",
    "newReservations",
    "cancelledReservations",
  ],
  from,
  to,
  scope,
  includeComparison: true,
  includeEvaluation: true,
});

const activationFunnel = await analytics.fetchFunnelConversion(ctx, {
  funnel: "guestActivation",
  from,
  to,
  scope,
});
```

---

## 11. Hospitality / MisaIOgi metric mapping (reference)

Typical funnel chain:

```text
qrScans → guestActivations → hospitalityViews → newReservations
  → confirmedReservations / cancelledReservations
```

Suggested `.evaluation()` mapping:

| Metric | Kind | Denominator / notes |
| ------ | ---- | ------------------- |
| `qrScans` | `goal` | Platform scan volume target for the queried range |
| `hospitalityViews` | `goal` | Discovery volume target |
| `guestActivations` | `conversion` | `qrScans` |
| `newReservations` | `comparison` or `goal` | Growth vs target depending on product choice |
| `cancelledReservations` | `inverseRate` | `newReservations` |

Suggested funnels:

| Funnel name | Steps (first → last) |
| ----------- | -------------------- |
| `guestActivation` | `qrScans`, `guestActivations` |
| `reservationFlow` | `guestActivations`, `newReservations` |
| `scanToConfirmed` | `qrScans`, …, `confirmedReservations` (as needed) |

---

## 12. What is explicitly out of scope

Do not expect these from the library yet:

- `distinctCount` aggregation
- Persisted labels in rollup tables
- Step-by-step funnel breakdown (only first→last conversion)
- Product permission / workflow enforcement via `unique.key`

---

## Related docs

- [README.md](./README.md) — full API reference, scopes, traffic modes, tracking, **Types**
- [CHANGELOG.md](./CHANGELOG.md) — version history

### TypeScript types

Import query response and config types from the package — do not re-declare them in
consumer apps:

```ts
import type {
  typesDashboardMetricsResponse,
  typesMetricEvaluationResponse,
  typesFunnelConversionResponse,
  typesWriteTrackResult,
  typesMetricEvaluationConfig,
} from "@piton-/analytics-convex";
```

See the [Types](./README.md#types) section in README for the full export list.
