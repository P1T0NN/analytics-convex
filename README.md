# Convex Analytics

Production-grade, server-side analytics for [Convex](https://convex.dev): event
ingestion, daily rollups, dashboard queries, high-volume batching, and raw event
retention — all in your Convex deployment.

**Start here:** [Installation](#installation) → [Public API](#public-api) →
[Quick Start](#quick-start)

---

## Why

Building analytics in-house means you own the data, control the query latency,
and avoid per-event pricing. But doing it right takes work: you need
idempotency, efficient rollups that survive concurrent writes, sharding for hot
metrics, batch processing for noisy events, retention policies, and a query
layer that produces chart-ready responses without scanning raw events.

This component gives you all of that out of the box. Drop it into any Convex
project, define your events and metrics, and start tracking. Dashboard queries
hit indexed rollup rows — not the raw event table — so reads stay fast
regardless of event volume.

---

## Architecture

### Tables

| Table                   | Purpose                                                   | Retention                       |
| ----------------------- | --------------------------------------------------------- | ------------------------------- |
| `analyticsEvents`       | Raw event log with idempotency keys                       | Configurable (default 90 days)  |
| `analyticsDailyMetrics` | Pre-aggregated daily rollup rows, sharded by traffic mode | Forever (powers all dashboards) |
| `analyticsUniqueEvents` | Product-level uniqueness claims by deterministic key      | Forever                         |

### Data flow

```
writeTrack() mutation
  → validates input against registered event config
  → builds idempotency key (event name + timestamp + actor + org + subject + scopes + properties + source)
  → optionally claims unique.key (duplicate → no raw event, no rollup)
  → schedules `internalWriteAnalyticsEvent` via `ctx.scheduler.runAfter(0, ...)`
  → returns `{ scheduled, scheduledCount, deduped?, dedupedCount? }` immediately

[async] internalWriteAnalyticsEvent (internal mutation)
  → checks idempotency (duplicate → no-op)
  → inserts raw event into analyticsEvents
  → for each matching metric:
      → low/medium volume: updates rollup rows inline (sharded writes)
      → high volume: marks event as pending, cron processes it in batches
```

Events, metrics, and settings are runtime config defined in your app's
`convex/analytics.ts`. The generated app-side helpers pass that config into the
component automatically, so changing analytics definitions is just a code change
and deploy. Access the resolved config via `analytics.config` — useful for
inspecting settings, passing to crons, or logging at startup.

### Why scheduled writes?

The `writeTrack` mutation returns immediately after scheduling. The actual DB
insert and rollup aggregation happen asynchronously. This means your product
mutations never wait on analytics writes — the product logic commits and returns
to the user, analytics catches up in the background.

---

### Package layout

**Consumer apps:** import only from `@piton-/analytics-convex`. See [Public API](#public-api).

**Contributors:** respect folder boundaries and naming:

| Path | Purpose |
| ---- | ------- |
| `src/client/index.ts` | Public package exports — the only surface consumer apps should use |
| `src/component/lib.ts` | Component Convex exports (`components.analytics.lib.*`) |
| `src/component/mutations/`, `queries/`, `crons/` | Component Convex functions |
| `src/component/helpers/`, `validations/`, `utils/` | Component implementation (functions prefixed `internal*`) |
| `src/shared/constants.ts` | All constants (`ANALYTICS_LIMITS`, `DAY_MS`, scope separators, traffic mode, metric labels) |
| `src/shared/types/` | TypeScript types grouped by domain |
| `src/shared/schemas/` | Shared Convex validators |
| `src/shared/utils/` | Pure helpers (`analyticsEvaluationUtils.ts`, `analyticsScopesUtils.ts`, etc.) |

**Naming rule:** functions safe for consumer projects have normal names (`defineAnalytics`, `fetchSummary`, `evaluateMetricLabel`). Functions meant only for library internals are prefixed with `internal` (`internalValidateConfiguration`, `internalWriteAnalyticsEvent`, …). Do not call `internal*` functions from app code.

Regenerate Convex bindings after component export changes: `npm run build:codegen`.

### LLM integration prompt

When asking an LLM to install this package into another Convex project, you can
use this prompt:

```text
Use this README to integrate @piton-/analytics-convex into my Convex app.

This analytics component is for in-product, database-backed analytics (feature usage,
counters, revenue, org/resource activity, dashboards). Not for marketing page-view
analytics — use Umami or similar for that.

Public API: import only from @piton-/analytics-convex. Use defineAnalytics with event,
property, count, sum, optional funnels and .evaluation() on metrics. Server helpers:
writeTrack, fetchSummary, fetchDashboardMetrics, fetchMetricEvaluation,
fetchFunnelConversion, etc. Import types from the package — do not re-declare them.

Register the component in convex.config.ts. Define convex/analytics.ts with
defineAnalytics. Register crons via analytics.registerCrons(crons, internal.analytics.crons).
Track from mutations with analytics.writeTrack or analytics.track. Use unique.key for
once-ever counting. Use mediumVolume by default; highVolume for noisy metrics.

Respect ANALYTICS_LIMITS, scopes, authorize on client wrappers, and traffic mode guidance.
Do not import or call internal* functions from the library source.
```

---

## Installation

```bash
npm install @piton-/analytics-convex
```

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import analytics from "@piton-/analytics-convex/convex.config.js";

const app = defineApp();
app.use(analytics);

export default app;
```

Run `npx convex dev` to regenerate the generated API.

---

## Public API

Import everything your app needs from `@piton-/analytics-convex`. Do not import from
`src/shared/*`, `src/component/*`, or deep paths inside the package.

### Setup (once per project)

| Export | Use |
| ------ | --- |
| `defineAnalytics` | Create `convex/analytics.ts` — events, metrics, funnels, settings, `authorize` |
| `event`, `property`, `count`, `sum` | Define events and metrics |
| `registerAnalyticsCrons` | Wired via `analytics.registerCrons(...)` in `convex/crons.ts` |

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
| `fetchDimensionTotals` | Dimension totals as `Map` (alias: `fetchMetricTotalsByDimension`) |
| `fetchTopDimension` | Top dimension value or `null` (alias: `fetchTopDimensionValue`) |
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
| `evaluateMetricLabel`, `computeConversionRatePercent` | Label math in UI (same rules as `fetchMetricEvaluation`) |
| `ANALYTICS_METRIC_LABELS` | Default display strings for labels |
| `getAnalyticsRanking`, `compareScores` | Sort/rank by score with tie-breakers |
| `createAnalyticsScopeId`, `createAnalyticsResourceScope`, `createAnalyticsResourceScopeId`, `createAnalyticsResourceScopeInput` | Build consistent scope IDs |
| `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, scope separator constants | Limits and enums |
| `types*` exports | TypeScript types — import from the package; do not copy into app code |
| Validators (`propertyValueValidator`, `scopeInputValidator`, …) | App-side Convex arg validation when needed |

Lower-level exports (`createAnalyticsApi`, `setupAnalytics`, `createAnalyticsReader`,
`createAnalyticsTracker`, `trackAnalytics*`, `configureAnalytics`) exist for advanced
wiring. Most apps only need `defineAnalytics`.

---

## Quick Start

### 1. Define your events and metrics

```ts
// convex/analytics.ts
import { components } from "./_generated/api";
import { defineAnalytics, event, property } from "@piton-/analytics-convex";

export const analytics = defineAnalytics(components.analytics, {
	events: {
		pageViewed: event("page.viewed", {
			label: "Page viewed",
			properties: {
				path: property.string({ required: true }),
				referrer: property.string(),
			},
		}),
		featureUsed: event("feature.used", {
			label: "Feature used",
			properties: {
				feature: property.string({ required: true }),
				plan: property.string(),
				value: property.number(),
			},
		}),
	},
	metrics: ({ count, sum }) => ({
		pageViews: count("Page views").from("page.viewed").by("path", "referrer"),
		featureUses: count("Feature uses")
			.description("Total feature usage across all plans")
			.from("feature.used")
			.by("feature", "plan")
			.trafficMode("mediumVolume") // optional per-metric override
			.adminOnly(false), // restrict query access to admins
		featureValue: sum("Feature value", "currency")
			.from("feature.used")
			.value("value")
			.by("feature", "plan"),
	}),
	authorize: async (ctx, operation) => {
		// Add your app's auth logic here.
		// Throw a ConvexError to deny access.
	},
});
```

### 2. Track events

**From a server mutation:**

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { analytics } from "./analytics";

export const useFeature = mutation({
	args: { feature: v.string(), plan: v.string() },
	handler: async (ctx, args) => {
		// ...your product logic...

		await analytics.writeTrack(ctx, "feature.used", {
			actorId: ctx.auth.userId, // optional — who did this
			organizationId: user.orgId, // optional — which org
			properties: {
				feature: args.feature,
				plan: args.plan,
			},
		});
	},
});
```

You can also pass the event as one object:

```ts
await analytics.track(ctx, {
	name: "page.viewed",
	properties: { path: "/dashboard" },
});
```

**Product-level unique events:**

Use `unique.key` when an event should count only once across timestamps, retries,
or future calls. Keys are global within the analytics component, so include a
namespace and the product identifiers that define uniqueness.

```ts
await analytics.track(ctx, {
	name: "qr.scanned",
	actorId: guestId,
	properties: {
		hospitalityId,
		accommodationId,
	},
	unique: {
		key: `guestView:${guestId}:${hospitalityId}`,
		scope: "forever", // optional; forever is the only supported scope today
	},
});
```

For daily active users, include the UTC day in the deterministic key:

```ts
const day = new Date(now).toISOString().slice(0, 10);

await analytics.track(ctx, {
	name: "user.active",
	actorId: userId,
	unique: { key: `dailyActive:${day}:${userId}` },
});
```

**Batch ingestion:**

Use `analytics.track(ctx, { events })` when you already have multiple events
buffered. Each call is bounded by `ANALYTICS_LIMITS.maxTrackBatchSize`; chunk
larger firehose inputs into multiple calls.

```ts
await analytics.track(ctx, {
	events: [
		{
			name: "page.viewed",
			properties: { path: "/dashboard" },
			source: { type: "server" },
		},
		{
			name: "feature.used",
			properties: { feature: "export", plan: "pro" },
			source: { type: "server" },
		},
	],
});
```

If you do want client or route-callable wrappers, export the Convex functions
explicitly from `convex/analytics.ts`:

```ts
export const {
	writeTrack,
	fetchTimeSeries,
	fetchSummary,
	fetchBreakdown,
	fetchMetricComparison,
	fetchMetricConversion,
	fetchMetricEvaluation,
	fetchDashboardMetrics,
	fetchFunnelConversion,
} = analytics.client;
```

The wrapped functions (`writeTrack`, `fetchTimeSeries`, etc.) include your
`authorize` callback. The server-side helpers at the top level (`writeTrack`,
`fetchSummary`, `fetchTimeSeries`, etc.) bypass that callback and are meant for
Convex functions that already have their own auth.

### 3. Register crons

First, paste these thin wrapper mutations once — they let the Convex cron
scheduler reference component functions through your app's internal API:

```ts
// convex/analytics/crons.ts
import { internalMutation } from "../_generated/server";
import { components } from "../_generated/api";

export const processPendingHighVolumeAnalyticsEvents = internalMutation({
    handler: async (ctx) => {
        await ctx.runMutation(
            components.analytics.lib.processPendingHighVolumeAnalyticsEvents,
            {},
        );
    },
});

export const purgeStaleAnalyticsEvents = internalMutation({
    handler: async (ctx) => {
        await ctx.runMutation(
            components.analytics.lib.purgeStaleAnalyticsEvents,
            {},
        );
    },
});
```

Then register the jobs from your `crons.ts`:

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { analytics } from "./analytics";

const crons = cronJobs();

analytics.registerCrons(crons, internal.analytics.crons, {
    highVolumeBatchIntervalMinutes: 1, // default: 1
    retentionIntervalHours: 24, // default: 24
});

export default crons;
```

The crons run two jobs:

- **High-volume batch processor** — aggregates pending high-volume events into
  rollup rows
- **Retention purger** — deletes raw events older than `rawEventRetentionDays`

Without crons, high-volume metrics will never aggregate and raw events will
accumulate indefinitely.

---

## Configuration

### Event config

| Field                | Type                                                | Description                                                             |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| `name`               | `string`                                            | Unique event identifier (e.g. `"page.viewed"`)                          |
| `label`              | `string`                                            | Human-readable label for dashboards                                     |
| `properties`         | `Record<string, "string" \| "number" \| "boolean">` | Optional — registered property types                                    |
| `requiredProperties` | `string[]`                                          | Optional — properties that must be present on every `writeTrack()` call |

### Metric config

| Field           | Type                                            | Description                                                                       |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `name`          | `string`                                        | Unique metric identifier (e.g. `"pageViews"`)                                     |
| `label`         | `string`                                        | Human-readable label for dashboards                                               |
| `description`   | `string`                                        | Optional — longer description                                                     |
| `unit`          | `"count" \| "currency" \| "bytes"`              | Unit used in query responses                                                      |
| `eventNames`    | `string[]`                                      | Which events feed this metric                                                     |
| `aggregation`   | `"count" \| "sum"`                              | `count` = each event adds 1; `sum` = each event adds the value of `valueProperty` |
| `valueProperty` | `string`                                        | Required when `aggregation` is `"sum"`                                            |
| `dimensions`    | `string[]`                                      | Properties available for `groupBy` in queries                                     |
| `trafficMode`   | `"lowVolume" \| "mediumVolume" \| "highVolume"` | Optional per-metric override                                                      |
| `adminOnly`     | `boolean`                                       | If `true`, the `authorize` callback receives `adminOnly` info for access control  |
| `evaluation`    | `MetricEvaluationConfig`                        | Optional — dashboard label rules for comparison, conversion, or inverse rate    |

### Settings

Pass a partial `settings` object to `defineAnalytics`, `setupAnalytics`, or
`createAnalyticsApi` to override defaults in code:

| Setting                          | Default          | Description                                            |
| -------------------------------- | ---------------- | ------------------------------------------------------ |
| `trafficMode`                    | `"mediumVolume"` | Global default traffic mode                            |
| `mediumVolumeShardCount`         | `8`              | Shard count for medium-volume metrics                  |
| `highVolumeShardCount`           | `32`             | Shard count for high-volume metrics                    |
| `highVolumeBatchSize`            | `250`            | Events processed per batch                             |
| `highVolumeBatchIntervalMinutes` | `1`              | Cron cadence for batch processing                      |
| `highVolumeMaxCatchupBatches`    | `4`              | Max consecutive catch-up batches per cron tick         |
| `maxQueryRangeDays`              | `366`            | Max inclusive date range for queries                   |
| `maxRollupRowsPerQuery`          | `20_000`         | Hard cap for rows read by a single query               |
| `maxBreakdownItems`              | `12`             | Max dimension values returned by grouped queries       |
| `rawEventRetentionDays`          | `90`             | Days before raw events are purged (`0` = keep forever) |
| `maxRawEventDeletesPerRun`       | `5_000`          | Max raw events deleted per retention cron run          |

### Hard limits

The component enforces hard limits before data is stored or scheduled. Import
`ANALYTICS_LIMITS` if you want to mirror these caps in your own forms, queues,
or ingestion workers.

| Limit                                    |                                  Value |
| ---------------------------------------- | -------------------------------------: |
| Events per configuration                 |                                    200 |
| Metrics per configuration                |                                    200 |
| Properties per event config              |                                     50 |
| Required properties per event            |                                     50 |
| Event names per metric                   |                                     50 |
| Dimensions per metric                    |                                      8 |
| Events per `writeTrack({ events })` call |                                    100 |
| Scopes per tracked event                 |                                     20 |
| Properties per tracked event             |                                     50 |
| Identifier length                        |                              128 chars |
| Label length                             |                              256 chars |
| Description length                       |                            1,024 chars |
| Single string property value             |                            2,048 chars |
| Total property payload                   |                           16,384 chars |
| Unique event key                         |                              512 chars |
| Medium-volume shards                     |                                 64 max |
| High-volume shards                       |                                256 max |
| High-volume batch size                   |                              1,000 max |
| High-volume catch-up batches             |                                 20 max |
| Query range                              |                         3,660 days max |
| Rollup rows per query                    |                            100,000 max |
| Breakdown items                          |                                100 max |
| Raw event retention                      | 3,650 days max, or `0` to keep forever |
| Raw event deletes per retention run      |                             10,000 max |
| Funnels per configuration                |                                     50 |
| Steps per funnel                         |                                     10 |
| Metrics per dashboard batch query        |                                     24 |

---

## Tracking

### Idempotency

Every `writeTrack()` call generates an idempotency key from: event name +
timestamp + actor + organization + subject + scopes + properties + source.
Duplicate calls with the same parameters within the same millisecond are
silently ignored. This means you can safely retry failed product mutations
without double-counting analytics.

### Product uniqueness

Idempotency protects retry safety for the same event payload. It does not mean
"count this product action only once forever." For product-level uniqueness, pass
`unique.key` on the tracking call:

```ts
await analytics.track(ctx, {
	name: "campaign.converted",
	actorId: userId,
	properties: { campaignId },
	unique: { key: `conversion:${userId}:${campaignId}` },
});
```

If the key was already claimed, the component returns a deduped result, does not
insert a raw event, and does not update rollups:

```ts
{
	scheduled: false,
	scheduledCount: 0,
	deduped: true,
	dedupedCount: 1,
}
```

For batches, duplicate unique keys are skipped and the accepted events are still
scheduled. Dashboard reads remain unchanged because only accepted events update
`analyticsDailyMetrics`.

This is event-level uniqueness. The component does not yet implement
metric-level `distinctCount("actorId")`; true distinct-count metrics need
per-metric and per-bucket cardinality storage, which is more expensive and has a
different data model.

Keep your own product ledger table when uniqueness is part of product state or
business rules, for example issuing a coupon once, granting a reward once,
showing whether a guest has already viewed an item, auditing the actor who won a
race, or reversing/expiring claims. `unique.key` is for analytics counting, not
for enforcing product permissions or workflows.

### Properties

Event properties must be registered in the event config. Unregistered properties
are rejected. Required properties must be present and non-null.

### Scopes

Events can be optionally scoped to an organization or resource:

```ts
await analytics.writeTrack(ctx, "page.viewed", {
	organizationId: "org_abc123",
	scopes: [{ scopeType: "resource", scopeId: "project:proj_xyz" }],
	properties: { path: "/dashboard" },
});
```

Scopes let you query analytics per-tenant or per-resource. See [Scopes](#scopes)
below.

### Source

Track where the event came from:

```ts
source: {
	type: "server";
} // default if omitted
source: {
	type: "client";
}
source: {
	type: "webhook";
}
source: {
	type: "system";
}
```

---

## Querying

All queries hit the `analyticsDailyMetrics` rollup table — never the raw event
log. This keeps reads fast regardless of how many raw events have been tracked.
In app-specific Convex functions, import your `analytics` object and call the
server helpers directly.

### Time series

Daily bucketed chart data. Returns one data point per day with optional
dimension grouping.

```ts
const result = await analytics.fetchTimeSeries(ctx, {
	metric: "pageViews",
	from: Date.UTC(2026, 0, 1),
	to: Date.UTC(2026, 0, 31),
	groupBy: "path", // optional — split by dimension
	scope: { type: "organization", id: "org_abc" }, // optional
	fill: true, // default true — fill gaps with zeros
});

// result.data:  [{ date: 1767225600000, "/home": 42, "/pricing": 18 }, ...]
// result.meta:  { metric, label, unit, scope, groupBy, seriesKeys, ... }
```

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

Compares a metric between two equal-length periods. The previous period is
auto-calculated by shifting the current range backward.

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
```

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
// }
```

Supported labels: `neutral`, `activity`, `good`, `excellent`, `bad`, `clear`.

Standard edge-case behavior:

| Case | Label |
|------|-------|
| `previous = 0`, `current > 0` | `activity` |
| `previous = 0`, `current = 0` | `neutral` |
| below `minVolumeForComparison` | `neutral` |
| conversion denominator below `minDenominator` | `neutral` |
| conversion denominator `0`, numerator `> 0` | `activity` |
| inverse rate `0%` | `clear` |
| no `.evaluation()` config on metric | `neutral` |

For UI reuse outside Convex queries, import the pure helper:

```ts
import {
	ANALYTICS_METRIC_LABELS,
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
// }
```

Rollup reads are deduped across metrics, comparison periods, and evaluation
denominators. Labels remain query-time only.

### Funnels

Define named funnels in `defineAnalytics` so conversion between the first and
last step is a single query:

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

Funnel steps must reference configured metrics. Each funnel needs at least two
unique steps. Conversion is always last step ÷ first step over the same range.

---

## Traffic modes

Every metric operates in one of three traffic modes. Choose based on expected
event volume and concurrency.

### `lowVolume`

Best for prototypes, admin panels, and internal tools.

- **Writes:** one rollup row per metric/day/scope/dimension — no sharding
- **Reads:** fewest rows per query
- **When to use:** < 5 events/sec sustained, < 25 events/sec bursts, < 50
  concurrent users

### `mediumVolume` (default)

Best for normal production SaaS apps.

- **Writes:** sharded across `mediumVolumeShardCount` rows (default 8) — spreads
  concurrent writes
- **Reads:** sums shard rows per query — still cheap
- **When to use:** 5–50 events/sec sustained, 100–300 events/sec bursts,
  50–1,000 concurrent users

### `highVolume`

Best for noisy product events, webhook-heavy systems, and large tenants.

- **Writes:** raw events are inserted and marked `pending` — a cron job
  processes them in batches of `highVolumeBatchSize`
- **Reads:** same as medium-volume (reads hit rollup rows, not raw events)
- **Trade-off:** dashboards may lag behind raw events by the cron interval
- **When to use:** 50+ events/sec sustained, 300+ events/sec bursts, 1,000+
  concurrent users

Per-metric override: set `trafficMode` on individual metrics in the metric
config. Unset metrics inherit the global setting.

### Recommended starting settings

These are starting points, not permanent rules. Confirm them with realistic load
and Convex Insights before treating them as production defaults.

| Traffic profile                                                | Recommended setup                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Low: prototypes, admin tools, under 5 events/sec sustained     | Global `trafficMode: "lowVolume"`, defaults for shard counts, retention 30-90 days, retention cron daily                                                                                                                                                                                             |
| Medium: normal SaaS, 5-50 events/sec sustained                 | Global `trafficMode: "mediumVolume"`, `mediumVolumeShardCount: 8-16`, `highVolumeShardCount: 32`, `highVolumeBatchSize: 250`, high-volume cron every 1-5 minutes                                                                                                                                     |
| High: noisy product events, webhooks, 50+ events/sec sustained | Keep normal metrics on `mediumVolume`, mark hot metrics `trafficMode: "highVolume"`, use `writeTrack({ events })` or `analytics.writeTrack(ctx, { events })`, `highVolumeShardCount: 64-128`, `highVolumeBatchSize: 500-1_000`, `highVolumeMaxCatchupBatches: 4-10`, high-volume cron every 1 minute |

For firehose-style intake, buffer events in your app or worker and send chunks
of at most `ANALYTICS_LIMITS.maxTrackBatchSize`. If Convex Insights shows OCC
conflicts on rollups, increase the relevant shard count or move that metric to
`highVolume`. If Insights shows high read volume on dashboard queries, reduce
`maxQueryRangeDays`, `maxRollupRowsPerQuery`, or dimension cardinality.

---

## Scopes

Scopes let you partition analytics data for multi-tenant or multi-resource use
cases. There are three scope types and three ways to attach them to an event.
The flexibility is intentional, but most apps should stay on the happy path
below and treat the explicit `scopes` array as an advanced feature.

### Choosing a scope (happy path)

Follow this order and you will rarely need anything else:

1. Do nothing — every event is always counted under `global`.
2. Set `organizationId` for true tenant or organization ownership.
3. Set `subject` for the primary resource the event is about (the one thing the
   event happened to).
4. Only reach for the explicit `scopes` array when you need an extra reporting
   partition that is not the org or the subject.

In other words: `organizationId` and `subject` are the normal tools, and
`scopes` is the escape hatch. You do not need to set all three.

> Cost note: every scope on an event multiplies how many rollup rows that event
> writes, across each metric and dimension. Adding scopes is cheap to write but
> not free — keep the list short and intentional.

### Global scope

Default — aggregates across all events. You never have to set this.

```ts
{
	type: "global";
}
```

### Organization scope

Aggregates events by organization. Use this for real tenant ownership.

```ts
{ type: "organization", id: "org_abc123" }
```

### Resource scope

Aggregates events by a resource type + ID pair. Useful for per-project,
per-workspace, or per-product metrics. For the primary resource an event is
about, prefer `subject` (see below) over an explicit resource scope.

```ts
{ type: "resource", resourceType: "project", id: "proj_xyz" }
```

### Tracking shape vs query shape

These two shapes describe the same thing but are used in different places, so
don't mix them up:

- Tracking events use `{ scopeType, scopeId }` in the `scopes` array.
- Queries use `{ type, id }` (and `resourceType` for resource scopes) in the
  `scope` parameter.

Prefer the exported helpers over hand-building either shape, so the tracking
scope and the query scope always resolve to the same ID:

- `createAnalyticsResourceScope(resourceType, id)` → tracking scope.
- `createAnalyticsResourceScopeInput(resourceType, id)` → query scope.

### Advanced: explicit scopes

Use the exported helpers when a project needs stable compound scope IDs, such as
owner-role analytics:

```ts
import { createAnalyticsScopeId } from "@piton-/analytics-convex";

const ownerScopeId = createAnalyticsScopeId("hospitalityOwner", userId);
// "hospitalityOwner:userId"
```

This is useful when you already store owner-role data under an organization
scope:

```ts
const totals = await analytics.fetchDimensionTotals(ctx, {
	metric: "newReservations",
	scope: { type: "organization", id: ownerScopeId },
	dimensionKey: "hospitalityId",
});
```

> Use `organizationId` for a compound ID like `hospitalityOwner:userId` only
> when you genuinely want to query it as an organization-like partition. If it
> is really a separate resource dimension, model it as a resource scope instead
> of overloading the organization scope.

For new resource-style scopes, create the tracking scope and query input from
the same resource type + ID:

```ts
import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeInput,
} from "@piton-/analytics-convex";

const ownerScope = createAnalyticsResourceScope("hospitalityOwner", userId);

await analytics.writeTrack(ctx, {
	name: "reservation.created",
	scopes: [ownerScope],
	properties: { hospitalityId },
});

const summary = await analytics.fetchSummary(ctx, {
	metric: "newReservations",
	from,
	to,
	scope: createAnalyticsResourceScopeInput("hospitalityOwner", userId),
});
```

Events automatically generate scopes from their `organizationId`, `subject`, and
explicit `scopes` array. Queries accept scopes via their `scope` parameter.

---

## Authorization

Pass an `authorize` callback to `defineAnalytics` (or `createAnalyticsApi`). It runs
only for **client wrappers** (`analytics.client.*`), not for server helpers.

```ts
authorize: async (ctx, operation) => {
	// operation.type: "configure" | "track" | "read"
	// operation.name: event name (track only)
	// operation.query: read query name (read only)
	// operation.metric / operation.metrics / operation.funnel: (read only)
	// operation.scope: requested scope (read only)

	const user = await getAuthUser(ctx);
	if (!user) throw new ConvexError("Not authenticated");

	if (operation.type === "configure" && user.role !== "admin") {
		throw new ConvexError("Admins only");
	}
};
```

Read query names on `operation.query`:

`timeSeries`, `summary`, `breakdown`, `metricComparison`, `metricConversion`,
`metricEvaluation`, `dashboardMetrics`, `funnelConversion`

The `adminOnly` flag on metric configs is informational — enforce it in `authorize`.

**Important:** Server helpers (`analytics.fetchSummary`, `analytics.writeTrack`, …) and
direct `components.analytics.lib.*` calls bypass `authorize`. Use them only from Convex
functions that already implement auth.

---

## Advanced helpers

### Dimension totals

Get aggregated totals by dimension value for counters, leaderboards, and ranked
lists. Use the configured `analytics` object so reads route through the
analytics component database:

```ts
const totals = await analytics.fetchDimensionTotals(ctx, {
	metric: "featureUses",
	scope: { type: "global" },
	dimensionKey: "feature",
	days: 30, // default 30
});

// totals: Map { "search" → 523, "export" → 412, "dashboard" → 301 }
```

### Top dimension value

Get the single highest-value dimension entry:

```ts
const top = await analytics.fetchTopDimension(ctx, {
	metric: "featureUses",
	scope: { type: "organization", id: "org_abc" },
	dimensionKey: "feature",
});

// top: "search" (or null if no data)
```

### Ranking utility

Pure function for sorting items by score with optional tie-breakers:

```ts
import { getAnalyticsRanking } from "@piton-/analytics-convex";

const top5 = getAnalyticsRanking({
	items: [...totals.entries()],
	getScore: ([, value]) => value,
	limit: 5,
	direction: "desc",
});
```

---

## Types

Import types and constants from `@piton-/analytics-convex`. Do not copy type definitions
into consumer apps or import from `src/shared/types/*` directly.

`defineAnalytics()` gives you typed metric/event names on server helpers automatically.
Use the exports below for UI components, shared app utilities, and explicit annotations.

### Where types live in the library

| Location | Contents |
| -------- | -------- |
| `src/shared/constants.ts` | `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, `ANALYTICS_METRIC_LABELS`, scope separators, `DAY_MS`, … |
| `src/shared/types/primitives.ts` | Units, aggregations, property types |
| `src/shared/types/settings.ts` | `typesAnalyticsSettings` |
| `src/shared/types/scopes.ts` | Scope input, resolved scope, metric scopes |
| `src/shared/types/config.ts` | Event/metric/funnel config (builder + `*Runtime` variants) |
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

  // Query responses
  typesMetricSummaryResponse,
  typesMetricComparisonResponse,
  typesMetricConversionResponse,
  typesMetricEvaluationResponse,
  typesDashboardMetricsResponse,
  typesFunnelConversionResponse,

  // Evaluation helpers
  typesMetricEvaluationResult,
  typesMetricComparisonInput,
  typesAnalyticsMetricLabel,
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
    | "inverse_rate";
};
```

### Funnel config

```ts
type typesAnalyticsFunnelConfig = {
  label: string;
  steps: string[];
};

type typesAnalyticsFunnelsConfig = Record<string, typesAnalyticsFunnelConfig>;
```

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

## API reference

### Component (`components.analytics.lib.*`)

Call these through server helpers or `ctx.runQuery` / `ctx.runMutation` with your
runtime config. These are Convex functions, not TypeScript helpers.

**Mutations:** `writeConfiguration`, `writeTrack`

**Queries:** `fetchConfiguration`, `fetchTimeSeries`, `fetchSummary`, `fetchBreakdown`,
`fetchMetricComparison`, `fetchMetricConversion`, `fetchMetricEvaluation`,
`fetchDashboardMetrics`, `fetchFunnelConversion`, `fetchMetricTotalsByDimension`,
`fetchTopDimensionValue`

**Crons:** `processPendingHighVolumeAnalyticsEvents`, `purgeStaleAnalyticsEvents`

### Package entry (`@piton-/analytics-convex`)

Everything below is safe to import in consumer apps.

| Category | Exports |
| -------- | ------- |
| Setup | `defineAnalytics`, `setupAnalytics`, `createAnalyticsApi` |
| Builders | `event`, `property`, `count`, `sum` |
| Tracking | `trackAnalytics`, `trackAnalyticsEvent`, `trackAnalyticsEvents` |
| Readers / trackers | `createAnalyticsReader`, `createAnalyticsTracker`, `configureAnalytics` |
| Evaluation | `evaluateMetricLabel`, `computeConversionRatePercent`, `ANALYTICS_METRIC_LABELS` |
| Ranking | `getAnalyticsRanking`, `compareScores` |
| Scopes | `createAnalyticsScopeId`, `createAnalyticsResourceScopeId`, `createAnalyticsResourceScope`, `createAnalyticsResourceScopeInput` |
| Constants | `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, `ANALYTICS_SCOPE_SEPARATOR`, `ANALYTICS_RESOURCE_SCOPE_SEPARATOR` |
| Crons | `registerAnalyticsCrons` |
| Validators | `propertyValueValidator`, `scopeInputValidator`, `scopeValidator`, `sourceValidator`, `subjectValidator`, `uniqueEventValidator`, `uniqueScopeValidator` |
| Types | All `types*` exports listed in [Types](#types) |

**Not exported to apps:** any function whose name starts with `internal` (library
implementation only).

See [CONSUMER-MIGRATION.md](./CONSUMER-MIGRATION.md) when upgrading from older versions.

---

## Production readiness

Before release, run the local gates:

```bash
bun run test
bun run test:stress
bun run typecheck
bun run lint
bun run build
```

Then exercise staging with realistic event volume, event names, scopes,
dimensions, and query ranges. During that run, inspect Convex Insights:

```bash
bun run insights
bun run insights:prod
```

Watch for high documents read, high bytes read, slow functions, OCC conflicts,
and pending high-volume events not being drained by the cron. Tune traffic mode,
shard counts, batch size, retention, and query limits based on those signals.

---

## Best practices

1. **Define events and metrics upfront** — adding a metric later means it only
   tracks future events (unless you build a custom backfill using the raw event
   table).

2. **Use the scheduler pattern** — `writeTrack()` returns immediately. If you
   need confirmation that an event was recorded, query the event table by
   idempotency key.

3. **Keep dimensions low-cardinal** — dimensions like `userId` or `sessionId`
   will create one rollup row per value per day, blowing up the rollup table and
   hitting `maxRollupRowsPerQuery`. Use dimensions for categorical data (plan,
   feature, path), not unique identifiers.

4. **Start with `mediumVolume`** — it's the safest default. Move individual hot
   metrics to `highVolume` if you see write contention or OCC errors around
   analytics writes.

5. **Configure scopes early** — if you're building a multi-tenant app, scope
   events by organization from day one. Retrofitting scopes requires a full
   event backfill.

6. **Keep analytics config in code** — change events, metrics, and settings in
   `convex/analytics.ts`. The app-side helpers pass that runtime config into the
   component automatically, so no configure command is required after deploys.

7. **Don't skip the crons** — without `registerAnalyticsCrons`, high-volume
   events never aggregate and raw events never expire.
