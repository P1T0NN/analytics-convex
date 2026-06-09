# Authorization

Pass an `authorize` callback to `defineAnalytics` (or `createAnalyticsApi`). It runs
only for **client wrappers** (`analytics.client.*`), not for server helpers.

```ts
authorize: async (ctx, operation) => {
	// operation.type: "configure" | "track" | "read"
	// operation.name: event name (track only)
	// operation.query: read query name (read only)
	// operation.metric / operation.metrics / operation.funnel: (read only)
	// operation.scope: requested scope (read only)

	const user = await getAuthUser(ctx);
	if (!user) throw new ConvexError("Not authenticated");

	if (operation.type === "configure" && user.role !== "admin") {
		throw new ConvexError("Admins only");
	}
};
```

Read query names on `operation.query`:

`timeSeries`, `summary`, `breakdown`, `metricComparison`, `metricConversion`,
`metricEvaluation`, `dashboardMetrics`, `funnelConversion`

The `adminOnly` flag on metric configs is informational — enforce it in `authorize`.

**Important:** Server helpers (`analytics.fetchSummary`, `analytics.writeTrack`, …) and
direct `components.analytics.lib.*` calls bypass `authorize`. Use them only from Convex
functions that already implement auth.

---
