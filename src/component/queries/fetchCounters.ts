// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// HELPERS
import { internalSumCounterShards } from "../helpers/counterReads";

/**
 * Exact current values for multiple counter keys (0 for absent keys).
 *
 * One indexed point read per key, run in parallel — never a table scan.
 */
export const fetchCounters = query({
	args: {
		keys: v.array(v.string()),
	},
	returns: v.record(v.string(), v.number()),
	handler: async (ctx, args) => {
		const entries = await Promise.all(
			args.keys.map(
				async (key) => [key, await internalSumCounterShards(ctx, key)] as const,
			),
		);

		return Object.fromEntries(entries);
	},
});
