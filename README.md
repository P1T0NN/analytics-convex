# Convex Analytics

A production-grade, server-side analytics component for
[Convex](https://convex.dev). Handles raw event ingestion, daily rollup
aggregation, dashboard queries, high-volume batch processing, and automated raw
event retention — all within your Convex deployment. Zero external dependencies
beyond Convex itself.

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

| Table                   | Purpose                                                          | Retention                       |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------- |
| `analyticsConfigs`      | Single document storing registered events, metrics, and settings | Forever                         |
| `analyticsEvents`       | Raw event log with idempotency keys                              | Configurable (default 90 days)  |
| `analyticsDailyMetrics` | Pre-aggregated daily rollup rows, sharded by traffic mode        | Forever (powers all dashboards) |

### Data flow

```
writeTrack() mutation
  → validates input against registered event config
  → builds idempotency key (event name + timestamp + actor + org + subject + scopes + properties + source)
  → schedules writeAnalyticsEvent via ctx.scheduler.runAfter(0, ...)
  → returns { scheduled: true } immediately

[async] writeAnalyticsEvent (internal mutation)
  → checks idempotency (duplicate → no-op)
  → inserts raw event into analyticsEvents
  → for each matching metric:
      → low/medium volume: updates rollup rows inline (sharded writes)
      → high volume: marks event as pending, cron processes it in batches
```

### Why scheduled writes?

The `writeTrack` mutation returns immediately after scheduling. The actual DB
insert and rollup aggregation happen asynchronously. This means your product
mutations never wait on analytics writes — the product logic commits and returns
to the user, analytics catches up in the background.

---

### Package structure

Most users only need the public exports, but contributors and LLM agents should
respect the internal file boundaries:

| Path                         | Purpose                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/component/schema.ts`    | Convex component tables, validators, and indexes. Add table/index changes here.                                      |
| `src/component/lib.ts`       | Public component export surface used as `components.analytics.lib.*`. New component functions must be exported here. |
| `src/component/mutations/`   | Public component mutations such as configuration, tracking, and batch tracking.                                      |
| `src/component/queries/`     | Public dashboard/query functions such as time series, summaries, breakdowns, and comparisons.                        |
| `src/component/helpers/`     | Shared component-side implementation helpers and internal mutations.                                                 |
| `src/component/validations/` | Configuration, event input, and hard-limit validation helpers.                                                       |
| `src/component/utils/`       | Pure utility functions for dates, scopes, sharding, ranking, and metric behavior.                                    |
| `src/component/crons/`       | Maintenance jobs for high-volume processing and raw event retention.                                                 |
| `src/client/builders/`       | Builder API for ergonomic event, property, and metric definitions.                                                   |
| `src/client/`                | Package API used by app-side Convex projects: `createAnalyticsApi`, server helpers, crons, schemas, and types.       |
| `src/shared/`                | Constants shared by the component and client packages, including `ANALYTICS_LIMITS`.                                 |

When adding new behavior, keep it in the matching folder instead of putting
everything into one file. Regenerate the Convex API after component export
changes with `bun run build:codegen`.

### LLM integration prompt

When asking an LLM to install this package into another Convex project, you can
use this prompt:

```text
Use this README to integrate @piton-/analytics-convex into my Convex app.

This analytics component is for in-product, database-backed analytics such as
feature usage, usage counters, revenue totals, credits consumed, org/resource
activity, summaries, time series, and breakdowns. Do not use it for marketing
page-view analytics; Umami or another web analytics tool handles that separately.

Follow the documented project structure and public API. Register the component
in convex.config.ts, define product events and metrics in convex/analytics.ts
with defineAnalytics, event, property, and the typed metrics callback
`metrics: ({ count, sum }) => ({ ... })`, run writeConfiguration after deploys
or config changes, register registerAnalyticsCrons in convex/crons.ts, and
use writeTrack from server mutations using the typed `analytics.writeTrack` helper.
For batch ingestion, call `analytics.writeTrack(ctx, { events: [...] })`.

Use mediumVolume by default, highVolume for noisy metrics, batch ingestion for
buffered/firehose-style tracking, and monitor Convex Insights before production.
Respect the documented hard limits, scopes, authorization model, and traffic
mode recommendations.
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

### 2. Run configure

Call `writeConfiguration` once — typically from the Convex dashboard or a
one-time script. Run it again whenever you add, remove, or rename events or
metrics.

```ts
// convex/admin.ts
import { mutation } from "./_generated/server";
import { analytics } from "./analytics";

export const configureAnalytics = mutation({
  args: {},
  handler: async (ctx) => {
    await analytics.writeConfiguration(ctx);
    return null;
  },
});
```

`writeConfiguration` is idempotent. It stores a deterministic `configHash`; when
the incoming events, metrics, and effective settings match the stored config, it
returns without updating the table. This makes it safe to run after every
deploy.

If you export the wrapped mutation from `convex/analytics.ts`:

```ts
export const { writeConfiguration } = analytics.client;
```

you can wire configuration into your normal scripts:

```json
{
  "scripts": {
    "analytics:configure": "bunx convex run analytics:writeConfiguration",
    "deploy": "bunx convex deploy && bun run analytics:configure"
  }
}
```

Keep the configure function explicit instead of lazy-configuring on the first
query or product mutation. Queries cannot write, and hidden configuration writes
make deploy mistakes harder to diagnose.

### 3. Track events

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
  writeConfiguration,
  writeTrack, // single or batch: writeTrack({ name, ... }) or writeTrack({ events })
  fetchTimeSeries,
  fetchSummary,
  fetchBreakdown,
  fetchMetricComparison,
} = analytics.client;
```

The wrapped functions (`writeTrack`, `fetchTimeSeries`, etc.) include your
`authorize` callback. The server-side helpers at the top level (`writeTrack`,
`writeConfiguration`, `fetchSummary`, `fetchTimeSeries`, etc.) bypass that
callback and are meant for Convex functions that already have their own auth.

### 4. Register crons

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
import { components } from "./_generated/api";
import { registerAnalyticsCrons } from "@piton-/analytics-convex";

const crons = cronJobs();

registerAnalyticsCrons(crons, components.analytics, {
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

### Settings

Pass a partial `settings` object to `createAnalyticsApi` or `writeConfiguration`
to override defaults:

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
| Medium-volume shards                     |                                 64 max |
| High-volume shards                       |                                256 max |
| High-volume batch size                   |                              1,000 max |
| High-volume catch-up batches             |                                 20 max |
| Query range                              |                         3,660 days max |
| Rollup rows per query                    |                            100,000 max |
| Breakdown items                          |                                100 max |
| Raw event retention                      | 3,650 days max, or `0` to keep forever |
| Raw event deletes per retention run      |                             10,000 max |

---

## Tracking

### Idempotency

Every `writeTrack()` call generates an idempotency key from: event name +
timestamp + actor + organization + subject + scopes + properties + source.
Duplicate calls with the same parameters within the same millisecond are
silently ignored. This means you can safely retry failed product mutations
without double-counting analytics.

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
cases.

### Global scope

Default — aggregates across all events.

```ts
{
  type: "global";
}
```

### Organization scope

Aggregates events by organization.

```ts
{ type: "organization", id: "org_abc123" }
```

### Resource scope

Aggregates events by a resource type + ID pair. Useful for per-project,
per-workspace, or per-product metrics.

```ts
{ type: "resource", resourceType: "project", id: "proj_xyz" }
```

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
const totals = await getAnalyticsMetricTotalsByDimension(ctx, {
  metric: "newReservations",
  scopeType: "organization",
  scopeId: ownerScopeId,
  dimensionKey: "hospitalityId",
});
```

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

Pass an `authorize` callback to `createAnalyticsApi`. It receives the auth
context and an operation descriptor:

```ts
authorize: async (ctx, operation) => {
  // operation.type: "configure" | "track" | "read"
  // operation.name: event name (track only)
  // operation.query: "timeSeries" | "summary" | "breakdown" (read only)
  // operation.metric: metric name (read only)
  // operation.scope: requested scope (read only)

  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");

  if (operation.type === "configure" && user.role !== "admin") {
    throw new ConvexError("Admins only");
  }
};
```

The `adminOnly` flag on metric configs is informational — it's up to your
`authorize` callback to enforce it.

**Important:** Authorization only applies to the wrapped API (`writeTrack`,
`timeSeries`, etc.). Server-side helpers (`writeTrack`, `fetchSummary`, etc.)
and direct component calls bypass authorization. Use them only from mutations
that already implement their own auth.

---

## Advanced helpers

### Dimension totals

Get aggregated totals by dimension value for counters, leaderboards, and ranked
lists. Import directly and call with `ctx`:

```ts
import { getAnalyticsMetricTotalsByDimension } from "@piton-/analytics-convex";

const totals = await getAnalyticsMetricTotalsByDimension(ctx, {
  metric: "featureUses",
  scopeType: "global",
  scopeId: "__global",
  dimensionKey: "feature",
  days: 30, // default 30
});

// totals: Map { "search" → 523, "export" → 412, "dashboard" → 301 }
```

### Top dimension value

Get the single highest-value dimension entry:

```ts
import { getAnalyticsTopDimensionValue } from "@piton-/analytics-convex";

const top = await getAnalyticsTopDimensionValue(ctx, {
  metric: "featureUses",
  scopeType: "organization",
  scopeId: "org_abc",
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

## API reference

### Component exports (`components.analytics.lib.*`)

**Mutations:**

| Export                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `writeConfiguration`  | Store events, metrics, and settings config                   |
| `writeTrack`          | Validate and schedule one event or `{ events: [...] }` batch |
| `writeAnalyticsEvent` | Internal — scheduled by `writeTrack`, do not call directly   |

**Queries:**

| Export                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `fetchConfiguration`    | Read the current events, metrics, settings, and config hash |
| `fetchTimeSeries`       | Daily bucketed chart data with optional dimension grouping  |
| `fetchSummary`          | Single aggregated total for a metric over a date range      |
| `fetchBreakdown`        | Top dimension values ranked by total                        |
| `fetchMetricComparison` | Compare metric between current and previous period          |

**Helpers:**

| Export                                | Description                          |
| ------------------------------------- | ------------------------------------ |
| `getAnalyticsMetricTotalsByDimension` | Map of dimension values to totals    |
| `getAnalyticsTopDimensionValue`       | Single highest-value dimension entry |
| `getAnalyticsRanking`                 | Pure ranking/sorting utility         |

**Crons:**

| Export                                    | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `processPendingHighVolumeAnalyticsEvents` | Batch-aggregate pending high-volume events |
| `purgeStaleAnalyticsEvents`               | Delete raw events past retention window    |

### Client exports (`@piton-/analytics-convex`)

| Export                                               | Description                                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `defineAnalytics(component, options)`                | Preferred builder-based setup for wrapped functions, event-aware metric builders, and typed server-side use                            |
| `setupAnalytics(component, options)`                 | One-stop setup returning server wrappers at top level, client exports under `.client`, and `.registerCrons()`                          |
| `createAnalyticsApi(component, options)`             | Create wrapped functions plus typed server-side helpers like `writeTrack`, `writeConfiguration`, `fetchSummary`, and `fetchTimeSeries` |
| `createAnalyticsReader(component, metrics)`          | Lower-level typed read helper factory; normally use `createAnalyticsApi` instead                                                       |
| `createAnalyticsTracker(component, events)`          | Lower-level typed tracker helper; normally use `createAnalyticsApi` instead                                                            |
| `event(name, options)`                               | Define an analytics event with typed properties                                                                                        |
| `property.string/number/boolean(options?)`           | Define event property types, optionally required                                                                                       |
| `count(label)`                                       | Build a count metric with `.from(...)` and `.by(...)`; use through the `defineAnalytics` metrics callback for event-aware autocomplete |
| `sum(label, unit?)`                                  | Build a sum metric with `.from(...)`, `.value(...)`, and `.by(...)`; the typed callback restricts `.value(...)` to number properties   |
| `configureAnalytics(ctx, component, options)`        | Configure from a server mutation                                                                                                       |
| `trackAnalyticsEvent(ctx, component, input)`         | Track from a server mutation                                                                                                           |
| `trackAnalyticsEvents(ctx, component, events)`       | Track a bounded batch from a server mutation                                                                                           |
| `registerAnalyticsCrons(crons, component, options?)` | Register maintenance cron jobs                                                                                                         |
| `ANALYTICS_TRAFFIC_MODE`                             | Traffic mode constant object                                                                                                           |
| `ANALYTICS_LIMITS`                                   | Hard limit constants for ingestion, config, and runtime settings                                                                       |
| `getAnalyticsRanking`                                | Pure ranking/sorting utility with tie-breakers                                                                                         |
| `compareScores`                                      | Direction-aware score comparison for sorting                                                                                           |
| `getAnalyticsMetricTotalsByDimension`                | Aggregated dimension totals (Map) for counters and leaderboards                                                                        |
| `getAnalyticsTopDimensionValue`                      | Single highest-value dimension entry, or null                                                                                          |

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

6. **Run `writeConfiguration` after deploys** — whenever you change event or
   metric definitions, call `writeConfiguration` so the component's validation
   and aggregation logic stays in sync.

7. **Don't skip the crons** — without `registerAnalyticsCrons`, high-volume
   events never aggregate and raw events never expire.
