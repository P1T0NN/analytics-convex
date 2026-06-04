# TODO

## DX

- [x] **JSDoc on every export** — all 13 component exports and 4 client exports now have inline JSDoc with summaries and `@example` blocks. Includes `@internal` tags on `writeAnalyticsEvent` and the two cron jobs.

- [x] **Consistent naming convention** — queries use `fetch` prefix, mutations use `write` prefix: `writeConfiguration`, `writeTrack`, `writeAnalyticsEvent`, `fetchTimeSeries`, `fetchSummary`, `fetchBreakdown`, `fetchMetricComparison`, `fetchConfiguration`.

- [x] **Type-safe event names** — `createAnalyticsApi` now builds `v.union(v.literal(...))` validators from the registered event and metric names. `writeTrack` only accepts registered event names; `fetchTimeSeries`/`fetchSummary`/`fetchBreakdown` only accept registered metric names. Typos are caught at both compile time and runtime. Requires `as const` on the events/metrics arrays for full literal type inference.

- [x] **Single init call** — `setupAnalytics()` wraps `createAnalyticsApi` + `registerAnalyticsCrons` into one function. Returns mutations, queries, and a `registerCrons(crons)` method. The `convex/crons.ts` step cannot be eliminated (Convex requires app-level cron registration), but it's now a single method on the setup object.

- [x] **`registerAnalyticsCrons` discoverability** — bundled into `setupAnalytics().registerCrons()`. Developers no longer need to import a separate function.

## Documentation

- [x] **Comprehensive README** — covers architecture, data flow, quick start, full config reference, tracking, all query types with examples, traffic modes with per-mode guidance, scopes, authorization, advanced helpers, full API reference, and best practices.
