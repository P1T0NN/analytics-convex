# Tracking

### Idempotency

Every `writeTrack()` call generates an idempotency key from: event name +
timestamp + actor + organization + subject + scopes + properties + source.
Duplicate calls with the same parameters within the same millisecond are
silently ignored. This means you can safely retry failed product mutations
without double-counting analytics.

### Product uniqueness

Idempotency protects retry safety for the same event payload. It does not mean
"count this product action only once forever." For product-level uniqueness, pass
`unique.key` on the tracking call:

```ts
await analytics.track(ctx, {
	name: "campaign.converted",
	actorId: userId,
	properties: { campaignId },
	unique: { key: `conversion:${userId}:${campaignId}` },
});
```

If the key was already claimed, the component returns a deduped result, does not
insert a raw event, and does not update rollups:

```ts
{
	scheduled: false,
	scheduledCount: 0,
	deduped: true,
	dedupedCount: 1,
}
```

For batches, duplicate unique keys are skipped and the accepted events are still
scheduled. Dashboard reads remain unchanged because only accepted events update
`analyticsDailyMetrics`.

This is event-level uniqueness. The component does not yet implement
metric-level `distinctCount("actorId")`; true distinct-count metrics need
per-metric and per-bucket cardinality storage, which is more expensive and has a
different data model.

Keep your own product ledger table when uniqueness is part of product state or
business rules, for example issuing a coupon once, granting a reward once,
showing whether a guest has already viewed an item, auditing the actor who won a
race, or reversing/expiring claims. `unique.key` is for analytics counting, not
for enforcing product permissions or workflows.

### Properties

Event properties must be registered in the event config. Unregistered properties
are rejected. Required properties must be present and non-null.

### Scopes

Events can be optionally scoped to an organization or resource:

```ts
await analytics.writeTrack(ctx, "page.viewed", {
	organizationId: "org_abc123",
	scopes: [{ scopeType: "resource", scopeId: "project:proj_xyz" }],
	properties: { path: "/dashboard" },
});
```

Scopes let you query analytics per-tenant or per-resource. See [Scopes](./scopes.md)
below.

### Source

Track where the event came from:

```ts
source: {
	type: "server";
} // default if omitted
source: {
	type: "client";
}
source: {
	type: "webhook";
}
source: {
	type: "system";
}
```

---
