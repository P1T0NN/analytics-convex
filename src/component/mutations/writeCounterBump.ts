// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// ERRORS
import { internalBadRequest } from "../errors/errors";

/**
 * Add `delta` to a counter key inside the caller's transaction.
 *
 * Counters are exact by contract: call this from the same app mutation that
 * inserts/deletes/patches the rows being counted. With `shards > 1` the delta
 * lands on a uniform-random shard row so hot keys avoid OCC contention; reads
 * always sum every shard, so mixed shard configs across call sites stay correct.
 */
export const writeCounterBump = mutation({
	args: {
		key: v.string(),
		delta: v.number(),
		shards: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const shards = args.shards ?? 1;
		if (!Number.isInteger(shards) || shards < 1) {
			internalBadRequest("counters: `shards` must be a positive integer.");
		}
		if (!Number.isFinite(args.delta)) {
			internalBadRequest("counters: `delta` must be a finite number.");
		}

		const shard = shards === 1 ? 0 : Math.floor(Math.random() * shards);
		const existing = await ctx.db
			.query("analyticsCounters")
			.withIndex("by_key_and_shard", (q) =>
				q.eq("key", args.key).eq("shard", shard),
			)
			.unique();

		if (existing) {
			await ctx.db.patch("analyticsCounters", existing._id, {
				value: existing.value + args.delta,
			});
		} else {
			await ctx.db.insert("analyticsCounters", {
				key: args.key,
				shard,
				value: args.delta,
			});
		}

		return null;
	},
});
