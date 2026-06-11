# Authorization

Pass an `authorize` callback to `defineAnalytics`. It runs
only for **client wrappers** (`analytics.client.*`), not for server helpers.

```ts
authorize: async (ctx, operation) => {
	// operation.type: "configure" | "configureMetricEvaluation" | "track" | "read"
	// operation.name: event name (track only)
	// operation.query: read query name (read only)
	// operation.metric / operation.metrics / operation.funnel: (read only)
	// operation.scope: requested scope (read + configureMetricEvaluation)

	const user = await getAuthUser(ctx);
	if (!user) throw new ConvexError("Not authenticated");

	if (operation.type === "configure" && user.role !== "admin") {
		throw new ConvexError("Admins only");
	}

	// setMetricEvaluation, e.g. an org admin editing their own goal:
	if (operation.type === "configureMetricEvaluation") {
		await assertCanManageOrganizationScope(ctx, user, operation.scope);
	}
};
```

Read query names on `operation.query`:

`timeSeries`, `summary`, `breakdown`, `metricComparison`, `metricConversion`,
`metricEvaluation`, `metricEvaluationConfig`, `dashboardMetrics`,
`funnelConversion`, `journeyConversion`, `metricTotalsByDimension`,
`topDimensionValue`

The `adminOnly` flag on metric configs is informational — enforce it in `authorize`.

For per-scope goal overrides, see [Evaluation - Per-scope overrides](./evaluation.md#per-scope-overrides).

**Important:** Server helpers (`analytics.fetchSummary`, `analytics.writeTrack`, …) and
direct `components.analytics.lib.*` calls bypass `authorize`. Use them only from Convex
functions that already implement auth.

---
