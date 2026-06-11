# Funnels

This library has two funnel concepts:

| Type | Config key | Query | Use when |
| ---- | ---------- | ----- | -------- |
| Metric funnel | `funnels` | `fetchFunnelConversion` | You need a volume ratio between configured metrics |
| Journey funnel | `journeys` | `fetchJourneyConversion` | You need same-actor completion through ordered events |

Use `fetchMetricConversion` for an ad-hoc ratio between two metrics without
declaring a named funnel.

### Metric funnels

Metric funnels are ratios, not user journeys. They compute:

```txt
last step metric / first step metric
```

over the same date range and scope. They do not require the same actor to
perform both steps.

Define named metric funnels in `defineAnalytics`:

```ts
const analytics = defineAnalytics(components.analytics, {
	events,
	metrics,
	funnels: {
		guestActivation: {
			label: "Scan to activation",
			steps: ["qrScans", "guestActivations"],
		},
	},
});
```

Query with `fetchFunnelConversion`:

```ts
const funnel = await analytics.fetchFunnelConversion(ctx, {
	funnel: "guestActivation",
	from,
	to,
	scope: { type: "organization", id: organizationId },
});

// funnel: {
//   label: "Scan to activation",
//   steps: ["qrScans", "guestActivations"],
//   numeratorMetric: "guestActivations",
//   denominatorMetric: "qrScans",
//   numerator,
//   denominator,
//   ratePercent,
//   scope,
//   range,
// }
```

Funnel steps must reference configured metrics. Each funnel needs at least two
unique steps. Conversion is always the last step divided by the first step.

### Metric funnel breakdowns

Pass optional `groupBy` to get per-value conversion. The dimension must be
allowed on both the first and last funnel metrics.

```ts
const funnel = await analytics.fetchFunnelConversion(ctx, {
	funnel: "guestActivation",
	from,
	to,
	scope: { type: "organization", id: organizationId },
	groupBy: "plan",
});
```

Breakdown rows are capped at `settings.maxBreakdownItems`, ordered by the
largest denominator values first. Top-level totals still cover the full set.

### Journey funnels

Journey funnels track whether the same actor completed ordered event steps.
Steps may span multiple days: an actor can start a signup on Monday and finish
onboarding on Wednesday.

Configure journeys separately from metric funnels:

```ts
const analytics = defineAnalytics(components.analytics, {
	events,
	metrics,
	journeys: {
		checkout: {
			label: "Checkout journey",
			steps: ["checkout.started", "checkout.completed"],
			breakdownProperty: "plan",
		},
	},
});
```

Requirements:

- Each step is an event name, not a metric name.
- Tracked events must include `actorId`.
- Steps must occur in order.
- Step N only counts if the actor already completed step N-1 on the same UTC
  day or an earlier one.
- Step counts are distinct actors per step within the queried range.

An actor whose earlier steps happened before the queried range still counts for
later steps. That means a step rate can exceed 100% on narrow ranges. Query a
range that covers the whole journey window for clean funnels.

### Query journeys

```ts
const journey = await analytics.fetchJourneyConversion(ctx, {
	journey: "signup",
	from: Date.UTC(2026, 0, 10),
	to: Date.UTC(2026, 0, 10),
	scope: { type: "organization", id: organizationId },
});

// journey: {
//   label: "Signup journey",
//   steps: ["signup.started", "signup.completed", "onboarding.finished"],
//   stepCounts: [100, 72, 41],
//   ratePercents: [null, 72, 41],
//   scope,
//   range,
// }
```

`ratePercents[0]` is `null` because step 1 is the denominator. Step N is divided
by step 1.

### Journey breakdowns

When the journey config sets `breakdownProperty`, pass `groupBy` with the same
property name. Each actor's cohort comes from the property value on their first
step event.

```ts
const journey = await analytics.fetchJourneyConversion(ctx, {
	journey: "checkout",
	from,
	to,
	scope: { type: "organization", id: organizationId },
	groupBy: "plan",
});

// journey.breakdown: [
//   { dimensionValue: "pro", stepCounts: [60, 45], ratePercents: [null, 75] },
//   { dimensionValue: "free", stepCounts: [40, 12], ratePercents: [null, 30] },
// ]
```

Journey breakdown arrays are capped at `settings.maxBreakdownItems`, ordered by
largest first-step cohort.

### Choosing the right query

| Need | Query |
| ---- | ----- |
| One-off ratio between two metrics | `fetchMetricConversion` |
| Named ratio between configured metrics | `fetchFunnelConversion` |
| Same-actor ordered event sequence | `fetchJourneyConversion` |
| Dashboard health label for a conversion metric | `fetchMetricEvaluation` |

Use metric funnels when you care about volume ratios. Use journeys when you
care about conversion through a sequence for the same actor.

### Limits

The default limits are:

- 50 metric funnels per configuration
- 10 steps per metric funnel
- 50 journeys per configuration
- 10 steps per journey

See [Configuration - Hard limits](./configuration.md#hard-limits) and
[Scale and limits - Two funnel types](./scale-and-limits.md#two-funnel-types).

---
