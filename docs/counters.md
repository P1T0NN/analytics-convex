# Counters

Exact live counters, separate from event tracking. Use them to answer "how many
rows exist **right now**" (bookings for an accommodation, members in an org) in
O(log n) instead of scanning a table with `.collect()` inside a reactive query.

Counters are backed by [`@convex-dev/aggregate`](https://github.com/get-convex/aggregate)
and wired through database triggers, so they update in the same transaction as
the row change and can never be forgotten at a call site.

> **Changed in 2.0.** The `analytics.counters.bump/get/set` helpers were removed.
> See [Migrating from 1.x](#migrating-from-1x) at the bottom.

## State vs events

The rest of this library measures **activity**: tracked events roll up into
daily/hourly metrics that are monotonic, retention-pruned, and
approximate-by-contract. Counters measure **state**: they must go down on
deletes and stay exactly right forever.

| Question | Tool |
| --- | --- |
| "How many bookings does this accommodation have?" | Counter |
| "How many bookings were made last month?" | Metric (`fetchSummary`) |
| "How many members are in this org?" | Counter |
| "How did signups trend over 30 days?" | Metric (`fetchTimeSeries`) |

The test: **would deleting a row change the number?** Then it's a counter.

One consequence worth stating plainly — a counter reflects rows that *exist*.
If you hard-delete bookings and still want "bookings ever made", that is a
lifetime total: track a `booking.created` event and use a `count` metric. Do
not try to make a counter answer it.

## Install

Counters live behind their own entry point, so the package root stays
dependency-free. Only apps that use counters need these:

```bash
npm install @convex-dev/aggregate convex-helpers
```

Register one aggregate instance per counter. Each instance is an independent
B-tree, so give each a distinct name:

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import analytics from "@piton-/analytics-convex/convex.config.js";
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(analytics);
app.use(aggregate, { name: "bookingsByAccommodation" });

export default app;
```

## Declare your counters

```ts
// convex/counters.ts
import { defineCounters } from "@piton-/analytics-convex/counters";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const { counters, mutation, internalMutation } =
	defineCounters<DataModel>()((counter) => ({
		bookings: counter("bookings", {
			component: components.bookingsByAccommodation,
			namespace: (doc) => doc.accommodationId,
			sumValue: (doc) => doc.totalPrice,
		}),
	}));
```

`defineCounters` is curried — `<DataModel>()` first, then a callback that
receives a `counter` builder already bound to your data model. Naming the table
first is what lets `doc` narrow to that table's document, so
`doc.accommodationId` is typed and misspellings are caught. It mirrors the
`metrics: ({ count, sum }) => ({ ... })` callback in `defineAnalytics`.

| Field | Purpose |
| --- | --- |
| *(first argument)* | App table this counter follows |
| `component` | The `components.<name>` handle from `app.use(aggregate, { name })` |
| `namespace` | Partitions the tree. **This is the scaling lever** — see below |
| `sortKey` | Order within a namespace. Defaults to `_creationTime` |
| `sumValue` | Makes `sum()` meaningful. Omit and `sum()` returns 0 |

## Use the wrapped mutation

This is the part that matters. Triggers only fire through the wrapper:

```ts
// convex/bookings.ts
import { mutation } from "./counters";   // NOT from ./_generated/server

export const create = mutation({
	args: { accommodationId: v.id("accommodations"), totalPrice: v.number() },
	handler: async (ctx, args) => {
		// No bump call. The trigger handles it.
		await ctx.db.insert("bookings", args);
	},
});

export const cancel = mutation({
	args: { bookingId: v.id("bookings") },
	handler: async (ctx, args) => {
		await ctx.db.delete("bookings", args.bookingId);
	},
});
```

> **The one rule:** every mutation that writes a followed table must use this
> `mutation` (or your own wrapper composed with `wrapDB`). A raw `mutation` from
> `_generated/server` skips the trigger and the count drifts silently and
> permanently. This is the single failure mode — it is worth a lint rule.

Already have your own `customMutation` (auth, rate limiting)? Compose instead
of replacing:

```ts
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { mutation as rawMutation } from "./_generated/server";
import { wrapDB } from "./counters";

export const mutation = customMutation(rawMutation, customCtx(wrapDB));
```

## Read them

```ts
export const accommodationStats = query({
	args: { accommodationId: v.id("accommodations") },
	handler: async (ctx, args) => ({
		bookings: await counters.bookings.count(ctx, args.accommodationId),
		revenue: await counters.bookings.sum(ctx, args.accommodationId),
	}),
});
```

The namespace argument is required exactly when the definition declares a
`namespace` function, and rejected when it doesn't — enforced at the type level.

Need more than count and sum? The raw aggregate is exposed:

```ts
counters.bookings.aggregate.min(ctx, { namespace: accommodationId });
counters.bookings.aggregate.at(ctx, 0, { namespace: accommodationId });
counters.bookings.aggregate.paginate(ctx, { namespace: accommodationId });
```

## Namespaces are the scaling lever

Each namespace is a **separate B-tree**. Writes to different namespaces never
contend with each other, so choosing the right namespace is what makes counters
scale with your row and user count.

```ts
namespace: (doc) => doc.accommodationId   // bookings for A never block bookings for B
```

Without a namespace, every write to the table touches one shared tree, and
concurrent writes contend at its root. Namespace by the id you scope your reads
by and the problem mostly disappears on its own.

If a **single** namespace is still write-hot, the aggregate exposes two knobs
(`rootLazy` defaults to `true` already, which avoids the worst of it):

```ts
// One-off internal mutation. Clears the tree, so backfill afterwards.
await counters.bookings.aggregate.clear(ctx, {
	namespace: accommodationId,
	maxNodeSize: 32,   // wider tree, fewer shard collisions, slower reads
	rootLazy: true,
});
```

## Backfill existing rows

An aggregate only sees writes that happen after the trigger is wired. A table
with existing rows reads **0** until backfilled. Run this once per counter:

```ts
// convex/backfill.ts
export const backfillBookings = internalMutation({
	args: { cursor: v.optional(v.union(v.string(), v.null())) },
	handler: async (ctx, args) => {
		const result = await counters.bookings.backfill(ctx, {
			cursor: args.cursor ?? null,
			pageSize: 200,
		});

		if (!result.isDone) {
			await ctx.scheduler.runAfter(0, internal.backfill.backfillBookings, {
				cursor: result.cursor,
			});
		}

		return result;
	},
});
```

`backfill` uses `insertIfDoesNotExist`, so re-running a page is safe and you can
backfill while live writes continue.

## Migrating from 1.x

The 1.1.0 counters (`analyticsCounters` table, `bump`/`get`/`getMany`/`set`)
are gone. There is no compatibility shim — the data models are different.

1. Install `@convex-dev/aggregate` and `convex-helpers`.
2. `app.use(aggregate, { name })` per counter in `convex.config.ts`.
3. Replace key strings with a `defineCounters` declaration. A key like
   `` `accommodation:${id}:bookings` `` becomes
   `counter("bookings", { namespace: (doc) => doc.accommodationId, ... })`.
4. Delete every `analytics.counters.bump(...)` call. Switch those mutations to
   the wrapped `mutation`.
5. Replace `counters.get(ctx, key)` with `counters.<name>.count(ctx, namespace)`.
6. Backfill (above), then verify against a `.collect().length` on a small table
   before deleting the old counter rows.

The old `analyticsCounters` rows are orphaned once the component is upgraded;
nothing reads them and they carry no cost beyond storage.
