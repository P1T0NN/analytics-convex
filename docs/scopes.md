# Scopes

Scopes let you partition analytics data for multi-tenant or multi-resource use
cases. There are three scope types and three ways to attach them to an event.
The flexibility is intentional, but most apps should stay on the happy path
below and treat the explicit `scopes` array as an advanced feature.

### Choosing a scope (happy path)

Follow this order and you will rarely need anything else:

1. Do nothing — every event is always counted under `global`.
2. Set `organizationId` for true tenant or organization ownership.
3. Set `subject` for the primary resource the event is about (the one thing the
   event happened to).
4. Only reach for the explicit `scopes` array when you need an extra reporting
   partition that is not the org or the subject.

In other words: `organizationId` and `subject` are the normal tools, and
`scopes` is the escape hatch. You do not need to set all three.

> Cost note: every scope on an event multiplies how many rollup rows that event
> writes, across each metric and dimension. Adding scopes is cheap to write but
> not free — keep the list short and intentional.

### Global scope

Default — aggregates across all events. You never have to set this.

```ts
{
	type: "global";
}
```

### Organization scope

Aggregates events by organization. Use this for real tenant ownership.

```ts
{ type: "organization", id: "org_abc123" }
```

### Resource scope

Aggregates events by a resource type + ID pair. Useful for per-project,
per-workspace, or per-product metrics. For the primary resource an event is
about, prefer `subject` (see below) over an explicit resource scope.

```ts
{ type: "resource", resourceType: "project", id: "proj_xyz" }
```

### Tracking shape vs query shape

These two shapes describe the same thing but are used in different places, so
don't mix them up:

- Tracking events use `{ scopeType, scopeId }` in the `scopes` array.
- Queries use `{ type, id }` (and `resourceType` for resource scopes) in the
  `scope` parameter.

Prefer the exported helpers over hand-building either shape, so the tracking
scope and the query scope always resolve to the same ID:

- `createAnalyticsResourceScope(resourceType, id)` → tracking scope.
- `createAnalyticsResourceScopeInput(resourceType, id)` → query scope.

### Advanced: explicit scopes

Use the exported helpers when a project needs stable compound scope IDs, such as
owner-role analytics:

```ts
import { createAnalyticsScopeId } from "@piton-/analytics-convex";

const ownerScopeId = createAnalyticsScopeId("hospitalityOwner", userId);
// "hospitalityOwner:userId"
```

This is useful when you already store owner-role data under an organization
scope:

```ts
const totals = await analytics.fetchMetricTotalsByDimension(ctx, {
	metric: "newReservations",
	scope: { type: "organization", id: ownerScopeId },
	dimensionKey: "hospitalityId",
});
```

> Use `organizationId` for a compound ID like `hospitalityOwner:userId` only
> when you genuinely want to query it as an organization-like partition. If it
> is really a separate resource dimension, model it as a resource scope instead
> of overloading the organization scope.

For new resource-style scopes, create the tracking scope and query input from
the same resource type + ID:

```ts
import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeInput,
} from "@piton-/analytics-convex";

const ownerScope = createAnalyticsResourceScope("hospitalityOwner", userId);

await analytics.writeTrack(ctx, {
	name: "reservation.created",
	scopes: [ownerScope],
	properties: { hospitalityId },
});

const summary = await analytics.fetchSummary(ctx, {
	metric: "newReservations",
	from,
	to,
	scope: createAnalyticsResourceScopeInput("hospitalityOwner", userId),
});
```

Events automatically generate scopes from their `organizationId`, `subject`, and
explicit `scopes` array. Queries accept scopes via their `scope` parameter.

---
