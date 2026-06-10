# Tracking

### Idempotency

Every tracked event gets an idempotency key derived from: event name +
timestamp + position in the batch + actor + organization + subject + scopes +
properties + source. Separate calls that replay the exact same payload in the
same millisecond are silently ignored, so you can safely retry failed product
mutations without double-counting analytics.

Identical events inside a **single batch** are intentionally counted
separately — tracking the same `{ name: "button.clicked" }` twice in one
`track(ctx, { events })` call records two events, as you would expect.

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

This is event-level uniqueness. For daily active users and similar metrics, use
the `distinctActors()` metric builder. It deduplicates by `actorId` (or an
optional `.actor("propertyName")`) within each UTC day and stores actor claims for
accurate multi-day active-user totals.

For **journey funnels**, always pass `actorId` on events — journeys track
ordered steps per actor per UTC day. See [Querying — Journey funnels](./querying.md#journey-funnels-event-sequences).

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
await analytics.track(ctx, "page.viewed", {
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
