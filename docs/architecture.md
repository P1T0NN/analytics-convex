# Architecture

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

### Tables

| Table                   | Purpose                                                   | Retention                       |
| ----------------------- | --------------------------------------------------------- | ------------------------------- |
| `analyticsConfigurations` | Registered runtime config blobs keyed by hash          | Forever                         |
| `analyticsEvents`       | Raw event log with idempotency keys                       | Configurable (default 90 days)  |
| `analyticsDailyMetrics` | Pre-aggregated rollup rows (`granularity`: day or hour) | Configurable via `rollupRetentionDays` |
| `analyticsDailyActorClaims` | Distinct-actor claims for `distinctActors` metrics | Purged with rollup retention |
| `analyticsJourneyStepClaims` | Same-actor journey step claims | Purged with rollup retention |
| `analyticsUniqueEvents` | Product-level uniqueness claims by deterministic key | Forever |

### Data flow

```
writeTrack() mutation
  → validates input against registered event config
  → builds idempotency key (event name + timestamp + batch index + actor + org + subject + scopes + properties + source)
  → optionally claims unique.key (duplicate → no raw event, no rollup)
  → schedules `internalWriteAnalyticsEvent` via `ctx.scheduler.runAfter(0, ...)` with `configHash` only
  → returns `{ scheduled, scheduledCount, deduped?, dedupedCount? }` immediately

[async] internalWriteAnalyticsEvent (internal mutation)
  → resolves config by hash (registered on first writeTrack / writeConfiguration)
  → checks idempotency (duplicate → no-op)
  → inserts raw event into analyticsEvents
  → for each matching metric:
      → low/medium volume: updates rollup rows inline (sharded writes)
      → high volume: marks event as pending, cron processes it in batches
```

Events, metrics, and settings are runtime config defined in your app's
`convex/analytics.ts`. The generated app-side helpers pass `configHash` (and `config` on
first registration) into the component automatically. Access the resolved config via
`analytics.config` — useful for inspecting settings, passing to crons, or logging at startup.
Each config version gets a stable `configHash` derived from serialized events,
metrics, funnels, journeys, and settings.

### Why scheduled writes?

The `writeTrack` mutation returns immediately after scheduling. The actual DB
insert and rollup aggregation happen asynchronously. This means your product
mutations never wait on analytics writes — the product logic commits and returns
to the user, analytics catches up in the background.

---

### Package layout

**Consumer apps:** import only from `@piton-/analytics-convex`. See [Public API](./public-api.md).

**Contributors:** respect folder boundaries and naming:

| Path | Purpose |
| ---- | ------- |
| `src/client/index.ts` | Public package exports — the only surface consumer apps should use |
| `src/testing/index.ts` | Public test helpers (`@piton-/analytics-convex/testing`) |
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
