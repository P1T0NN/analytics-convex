# TODO



## 1.0.0 readiness



- [x] Single setup path — `defineAnalytics()` only

- [x] Cron wiring via `analytics.crons` + `analytics.registerCrons()`

- [x] Local volume harness — `npm run test:volume`

- [x] Example app — `example/convex/`

- [x] **Scale & limits doc** — `docs/scale-and-limits.md`

- [x] **Funnel semantics** — callout in querying + scale-and-limits

- [x] **Rollup retention** — documented as known limit (rollups forever, raw expires)

- [x] **CI** — `test:volume` in GitHub Actions

- [x] **Remove empty `http.ts` stub** — verify codegen still passes

- [ ] **`npm pack` sanity check** — install tarball in a fresh Convex app

- [ ] **Optional:** dogfood in one real production-adjacent app

- [ ] **Release 1.0.0** — stable API, docs complete, gates green



## Deferred post-1.0



- [ ] Stricter stored config schema (`analyticsConfigurations.config: v.any()`)

- [ ] `@piton-/analytics-convex/testing` export

- [ ] Rollup compaction/archival

- [ ] Cloud Insights load testing (optional)



## Done (0.1.x)



- [x] Config-by-hash, perf passes, legacy API removed

- [x] Split docs, typed API, 68+ tests

- [x] Released 0.1.27


