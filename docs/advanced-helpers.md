# Advanced Helpers

### Dimension totals

Get aggregated totals by dimension value for counters, leaderboards, and ranked
lists. Use the configured `analytics` object so reads route through the
analytics component database:

```ts
const totals = await analytics.fetchMetricTotalsByDimension(ctx, {
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
const top = await analytics.fetchTopDimensionValue(ctx, {
	metric: "featureUses",
	scope: { type: "organization", id: "org_abc" },
	dimensionKey: "feature",
});

// top: "search" (or null if no data)
```

For sorting totals or breakdown results in memory, see
[Utilities - Ranking helpers](./utils.md#ranking-helpers).

---
