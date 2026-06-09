# API Reference

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
| Setup | `defineAnalytics`, `createAnalyticsApi` |
| Builders | `event`, `property`, `count`, `sum` |
| Readers / trackers | `createAnalyticsReader`, `createAnalyticsTracker` |
| Evaluation | `evaluateMetricLabel`, `computeConversionRatePercent`, `computePercentOfGoal`, `ANALYTICS_METRIC_LABELS` |
| Ranking | `getAnalyticsRanking`, `compareScores` |
| Scopes | `createAnalyticsScopeId`, `createAnalyticsResourceScopeId`, `createAnalyticsResourceScope`, `createAnalyticsResourceScopeInput` |
| Constants | `ANALYTICS_LIMITS`, `ANALYTICS_TRAFFIC_MODE`, `ANALYTICS_SCOPE_SEPARATOR`, `ANALYTICS_RESOURCE_SCOPE_SEPARATOR` |
| Crons | `registerAnalyticsCrons` |
| Validators | `propertyValueValidator`, `scopeInputValidator`, `scopeValidator`, `sourceValidator`, `subjectValidator`, `uniqueEventValidator`, `uniqueScopeValidator` |
| Types | All `types*` exports listed in [Types](./types.md) |

**Not exported to apps:** any function whose name starts with `internal` (library
implementation only).

---
