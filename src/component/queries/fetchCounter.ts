// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// HELPERS
import { internalSumCounterShards } from "../helpers/counterReads";

/**
 * Exact current value of one counter key (0 if absent).
 *
 * Indexed point read on the key's shard rows only — a reactive query using
 * this subscribes to that key, never to the whole counters table.
 */
export const fetchCounter = query({
	args: {
		key: v.string(),
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		return await internalSumCounterShards(ctx, args.key);
	},
});
