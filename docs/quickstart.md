# Quick Start

### 1. Define your events and metrics

```ts
// convex/analytics.ts
import { components } from "./_generated/api";
import { defineAnalytics, event, property } from "@piton-/analytics-convex";

export const analytics = defineAnalytics(components.analytics, {
	events: {
		pageViewed: event("page.viewed", {
			label: "Page viewed",
			properties: {
				path: property.string({ required: true }),
				referrer: property.string(),
			},
		}),
		featureUsed: event("feature.used", {
			label: "Feature used",
			properties: {
				feature: property.string({ required: true }),
				plan: property.string(),
				value: property.number(),
			},
		}),
	},
	metrics: ({ count, sum }) => ({
		pageViews: count("Page views").from("page.viewed").by("path", "referrer"),
		featureUses: count("Feature uses")
			.description("Total feature usage across all plans")
			.from("feature.used")
			.by("feature", "plan")
			.trafficMode("mediumVolume") // optional per-metric override
			.adminOnly(false), // restrict query access to admins
		featureValue: sum("Feature value", "currency")
			.from("feature.used")
			.value("value")
			.by("feature", "plan"),
	}),
	authorize: async (ctx, operation) => {
		// Add your app's auth logic here.
		// Throw a ConvexError to deny access.
	},
});
```

### 2. Track events

**From a server mutation:**

```ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { analytics } from "./analytics";

export const useFeature = mutation({
	args: { feature: v.string(), plan: v.string() },
	handler: async (ctx, args) => {
		// ...your product logic...

		await analytics.writeTrack(ctx, "feature.used", {
			actorId: ctx.auth.userId, // optional — who did this
			organizationId: user.orgId, // optional — which org
			properties: {
				feature: args.feature,
				plan: args.plan,
			},
		});
	},
});
```

You can also pass the event as one object:

```ts
await analytics.track(ctx, {
	name: "page.viewed",
	properties: { path: "/dashboard" },
});
```

**Product-level unique events:**

Use `unique.key` when an event should count only once across timestamps, retries,
or future calls. Keys are global within the analytics component, so include a
namespace and the product identifiers that define uniqueness.

```ts
await analytics.track(ctx, {
	name: "qr.scanned",
	actorId: guestId,
	properties: {
		hospitalityId,
		accommodationId,
	},
	unique: {
		key: `guestView:${guestId}:${hospitalityId}`,
		scope: "forever", // optional; forever is the only supported scope today
	},
});
```

For daily active users, include the UTC day in the deterministic key:

```ts
const day = new Date(now).toISOString().slice(0, 10);

await analytics.track(ctx, {
	name: "user.active",
	actorId: userId,
	unique: { key: `dailyActive:${day}:${userId}` },
});
```

**Batch ingestion:**

Use `analytics.track(ctx, { events })` when you already have multiple events
buffered. Each call is bounded by `ANALYTICS_LIMITS.maxTrackBatchSize`; chunk
larger firehose inputs into multiple calls.

```ts
await analytics.track(ctx, {
	events: [
		{
			name: "page.viewed",
			properties: { path: "/dashboard" },
			source: { type: "server" },
		},
		{
			name: "feature.used",
			properties: { feature: "export", plan: "pro" },
			source: { type: "server" },
		},
	],
});
```

If you do want client or route-callable wrappers, export the Convex functions
explicitly from `convex/analytics.ts`:

```ts
export const {
	writeTrack,
	fetchTimeSeries,
	fetchSummary,
	fetchBreakdown,
	fetchMetricComparison,
	fetchMetricConversion,
	fetchMetricEvaluation,
	fetchDashboardMetrics,
	fetchFunnelConversion,
} = analytics.client;
```

The wrapped functions (`writeTrack`, `fetchTimeSeries`, etc.) include your
`authorize` callback. The server-side helpers at the top level (`writeTrack`,
`fetchSummary`, `fetchTimeSeries`, etc.) bypass that callback and are meant for
Convex functions that already have their own auth.

### 3. Register crons

Export the maintenance handlers from `convex/analytics.ts`, then register them:

```ts
// convex/analytics.ts — add after defineAnalytics(...)
export const {
	processPendingHighVolumeAnalyticsEvents,
	purgeStaleAnalyticsEvents,
} = analytics.crons;
```

```ts
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { analytics } from "./analytics";

const crons = cronJobs();

analytics.registerCrons(crons, internal.analytics, {
	highVolumeBatchIntervalMinutes: 1, // default: 1
	retentionIntervalHours: 24, // default: 24
});

export default crons;
```

The crons run two jobs:

- **High-volume batch processor** — aggregates pending high-volume events into
  rollup rows
- **Retention purger** — deletes raw events older than `rawEventRetentionDays`

Without crons, high-volume metrics will never aggregate and raw events will
accumulate indefinitely.

---
