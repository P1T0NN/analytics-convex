# API Reference

### Component (`components.analytics.lib.*`)

Call these through server helpers or `ctx.runQuery` / `ctx.runMutation` with your
runtime config. These are Convex functions, not TypeScript helpers.

**Mutations:** `writeConfiguration`, `writeTrack`, `writeMetricEvaluationOverride`,
`writeCounterBump`, `writeCounterSet`

**Queries:** `fetchConfiguration`, `fetchTimeSeries`, `fetchSummary`, `fetchBreakdown`,
`fetchMetricComparison`, `fetchMetricConversion`, `fetchMetricEvaluation`,
`fetchMetricEvaluationConfig`, `fetchDashboardMetrics`, `fetchFunnelConversion`,
`fetchJourneyConversion`, `fetchMetricTotalsByDimension`, `fetchTopDimensionValue`,
`fetchCounter`, `fetchCounters`

**Crons:** `processPendingHighVolumeAnalyticsEvents`, `purgeStaleAnalyticsEvents`,
`purgeStaleAnalyticsRollups`

### Package entry (`@piton-/analytics-convex`)

Everything below is safe to import in consumer apps.

| Category | Exports |
| -------- | ------- |
| Setup | `defineAnalytics`, `event`, `property`, `count`, `sum`, `avg`, `min`, `max`, `distinctActors` |
| Date ranges | `createAnalyticsCompletedDayRange`, `createAnalyticsTodayRange`, `createAnalyticsDayRange`, `previousAnalyticsDayRange`, `previousAnalyticsPeriodRange`, `analyticsDayRangeIncludesToday`, `getQueryBucketStart`, `listQueryBuckets`, `startOfUtcDay`, `startOfUtcWeek`, `startOfUtcMonth`, `normalizeAnalyticsDayRange`, `countUtcDaysInRange` |
| Evaluation | `evaluateMetricLabel`, `isGoalEvaluationConfig`, `metricLabelSentiment`, `computeConversionRatePercent`, `computePercentOfGoal`, `ANALYTICS_METRIC_LABEL_KEYS`, `ANALYTICS_METRIC_LABEL_SENTIMENTS`, `ANALYTICS_METRIC_LABELS` |
| Ranking | `getAnalyticsRanking`, `compareScores` |
| Scopes | `createAnalyticsScopeId`, `createAnalyticsResourceScopeId`, `createAnalyticsResourceScope`, `createAnalyticsResourceScopeInput` |
| Constants | `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, `ANALYTICS_SCOPE_SEPARATOR`, `ANALYTICS_RESOURCE_SCOPE_SEPARATOR` |
| Validators | `propertyValueValidator`, `scopeInputValidator`, `scopeValidator`, `sourceValidator`, `subjectValidator`, `uniqueEventValidator`, `uniqueScopeValidator` |
| Types | All `types*` exports listed in [Types](./types.md) |

`defineAnalytics()` also returns server helpers, optional `client` wrappers,
`crons`, `registerCrons`, and `config` — see [Public API](./public-api.md).

### Testing subpath (`@piton-/analytics-convex/testing`)

| Export | Purpose |
| ------ | ------- |
| `createAnalyticsComponentTest` | `convex-test` harness with analytics schema |
| `runtimeConfiguration` | Build test config + hash |
| `analyticsConfigArgs` | `{ configHash, config }` for component calls |
| `pageViewsConfiguration`, `revenueConfiguration` | Example configs |
| `DAY_MS` | UTC day constant |
| `buildVolumeEvents`, `volumeConfiguration`, `logVolumeTiming`, `VOLUME_EVENT_COUNTS` | Volume test helpers |

See [Testing](./testing.md).

**Not exported to apps:** any function whose name starts with `internal` (library
implementation only).

See [Evaluation](./evaluation.md) for labels, goals, and overrides. See
[Funnels](./funnels.md) for metric funnels and journeys. See
[Utilities](./utils.md) for pure helper examples.

---
