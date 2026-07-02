// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// ERRORS
import { internalBadRequest } from "../errors/errors";

/**
 * Overwrite a counter key with an absolute value (backfill/repair).
 *
 * Writes `value` to shard 0 and deletes every other shard row for the key in
 * the same transaction, so subsequent reads sum exactly one row.
 */
export const writeCounterSet = mutation({
	args: {
		key: v.string(),
		value: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		if (!Number.isFinite(args.value)) {
			internalBadRequest("counters: `value` must be a finite number.");
		}

		const rows = await ctx.db
			.query("analyticsCounters")
			.withIndex("by_key_and_shard", (q) => q.eq("key", args.key))
			.collect();

		const shardZero = rows.find((row) => row.shard === 0);
		for (const row of rows) {
			if (row !== shardZero) {
				await ctx.db.delete("analyticsCounters", row._id);
			}
		}

		if (shardZero) {
			await ctx.db.patch("analyticsCounters", shardZero._id, {
				value: args.value,
			});
		} else {
			await ctx.db.insert("analyticsCounters", {
				key: args.key,
				shard: 0,
				value: args.value,
			});
		}

		return null;
	},
});
