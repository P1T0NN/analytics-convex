# Changelog

## 0.1.25

- Add `goal` metric evaluation kind — compare rollup totals against a fixed
  `targetValue` for the queried date range.
- Export `computePercentOfGoal` from `@piton-/analytics-convex`.
- Extend `fetchMetricEvaluation` and `fetchDashboardMetrics` responses with an
  optional `goal` block (`targetValue`, `value`, `percentOfGoal`).

## 0.0.0

- Initial release.
