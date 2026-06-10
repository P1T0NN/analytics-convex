# TODO

## v1 readiness

- [x] Single setup path — `defineAnalytics()` only (no `createAnalyticsApi` / reader / tracker exports)
- [x] Cron wiring via `analytics.crons` + `analytics.registerCrons()`
- [ ] **Scale & limits doc** — honest bands, footguns (dimension cardinality, rollup growth, high-volume lag)
- [ ] **Staging load test** — sustained writes + Convex Insights before calling v1
- [x] **Local volume harness** — `npm run test:volume` (low/medium/high, no cloud usage)
- [x] **Example app** — `example/convex/` with analytics, demo mutations, crons
- [ ] **Rollup retention policy** — rollups live forever today; decide compaction/archival for v1 or document as known limit
- [ ] **Funnel naming clarity** — rename or document that funnels are first→last metric ratios, not user journeys
- [ ] **Stricter stored config schema** — replace `analyticsConfigurations.config: v.any()` when ready for migration
- [ ] **Remove empty `http.ts` stub** or implement if needed
- [ ] **Bump to 1.0.0** after staging validation and example app ship

## DX (done)

- [x] **JSDoc on every export** — all 13 component exports and 4 client exports now have inline JSDoc with summaries and `@example` blocks. Includes `@internal` tags on `writeAnalyticsEvent` and the two cron jobs.

- [x] **Consistent naming convention** — queries use `fetch` prefix, mutations use `write` prefix: `writeConfiguration`, `writeTrack`, `writeAnalyticsEvent`, `fetchTimeSeries`, `fetchSummary`, `fetchBreakdown`, `fetchMetricComparison`, `fetchConfiguration`.

- [x] **Type-safe event names** — `defineAnalytics()` builds typed validators from registered event and metric names. Typos are caught at compile time and runtime. Requires `as const` on the events map for full literal type inference.

- [x] **Single init call** — `defineAnalytics()` returns server helpers, client wrappers, runtime `config`, `crons`, and `registerCrons(crons)`.

- [x] **Cron discoverability** — wired via `defineAnalytics().crons` and `defineAnalytics().registerCrons()`.

## Documentation (done)

- [x] **Comprehensive docs** — split guides under `docs/`, slim root README.
