// TYPES
import type { QueryCtx } from "../_generated/server";

/**
 * Sum every shard row for a counter key. Rows per key are bounded by the
 * largest `shards` value any writer ever used, so this stays a small indexed
 * read regardless of table size.
 */
export async function internalSumCounterShards(
	ctx: QueryCtx,
	key: string,
): Promise<number> {
	const rows = await ctx.db
		.query("analyticsCounters")
		.withIndex("by_key_and_shard", (q) => q.eq("key", key))
		.collect();

	return rows.reduce((sum, row) => sum + row.value, 0);
}
