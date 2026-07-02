# Counters

Exact transactional state counters, separate from event tracking. Use them to
answer "how many rows exist right now" (total guests, reservations per status)
in O(1) instead of scanning a table with `.collect()` inside a reactive query.

## State vs events

The rest of this library measures **activity**: tracked events roll up into
daily/hourly metrics that are monotonic, retention-pruned, and
approximate-by-contract. Counters measure **state**: they must decrement on
deletes and status flips and stay exactly right forever. The two are
deliberately not connected — there is no way to derive a counter from a tracked
event, and no config option to wire a metric to one. Keep tracking your events
for dashboards; keep counters for live row counts.

**When to use counters vs metrics:** if the number can only go up and "roughly
right over a date range" is fine (page views, signups this week), track an
event and use a metric. If the number is the current size of something and must
be exact — including going down — (guests in the system, pending reservations),
use a counter. When in doubt: would deleting a row change the number? Then it's
a counter.

## Transactionality guarantee

`bump` and `set` are called from your own Convex mutation and participate in
**that mutation's transaction**. Bump in the same mutation that inserts,
deletes, or patches the rows you are counting and the counter can never drift
from table truth — either both commit or neither does.

Keys are plain strings your app owns and namespaces (e.g. `guests.total`,
`reservations.pending`). Deltas may be negative and values may go negative;
the library does not clamp — a negative count means an app bug, and `set`
exists to repair it.

## API (server helpers only)

Counters are not exposed on `analytics.client` — call them from your own
Convex functions, which already enforce your auth.

```ts
analytics.counters.bump(ctx, key, delta, opts?)  // mutation ctx; opts.shards defaults to 1
analytics.counters.get(ctx, key)                 // query or mutation ctx; 0 if absent
analytics.counters.getMany(ctx, keys)            // Record<string, number>; 0 for absent keys
analytics.counters.set(ctx, key, value)          // mutation ctx; backfill/repair
```

## Worked example: counting a `guests` table

```ts
export const createGuest = mutation({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		await ctx.db.insert("guests", { name: args.name });
		await analytics.counters.bump(ctx, "guests.total", 1);
	},
});

export const deleteGuest = mutation({
	args: { guestId: v.id("guests") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.guestId);
		await analytics.counters.bump(ctx, "guests.total", -1);
	},
});
```

Status flips are two bumps in the same mutation:

```ts
export const confirmReservation = mutation({
	args: { reservationId: v.id("reservations") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.reservationId, { status: "confirmed" });
		await analytics.counters.bump(ctx, "reservations.pending", -1);
		await analytics.counters.bump(ctx, "reservations.confirmed", 1);
	},
});
```

Reading in a dashboard query subscribes only to those keys' rows — writes to
the `guests` table itself never invalidate it:

```ts
export const dashboardCounts = query({
	args: {},
	handler: async (ctx) => {
		return await analytics.counters.getMany(ctx, [
			"guests.total",
			"reservations.pending",
			"reservations.confirmed",
		]);
	},
});
```

## Sharding: the contention escape hatch

By default a key is one row. Every bump rewrites that row, so once a single
key sustains roughly **tens of writes per second**, mutations start retrying on
OCC conflicts. When that appears, raise `shards` at the hot call site:

```ts
await analytics.counters.bump(ctx, "guests.total", 1, { shards: 8 });
```

Each bump then lands on a uniform-random shard row, spreading contention.
Reads always sum **all** rows for a key, so nothing else changes: `get` stays
correct with any mix of shard configs across call sites, old rows keep
counting, and you can raise or lower `shards` at any time without a migration.
Don't shard preemptively — every shard adds a row to each read.

## Backfill and repair

`set` writes the value to shard 0 and deletes all other shard rows in one
transaction. Use it to initialize a counter for an existing table or to repair
drift caused by an app bug (e.g. a delete path that forgot to bump):

```ts
// One-off internal mutation; batch with .take() if the table is large.
const guests = await ctx.db.query("guests").collect();
await analytics.counters.set(ctx, "guests.total", guests.length);
```
