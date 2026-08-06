// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// CONSTANTS
import {
	DEFAULT_PURGE_CATCHUP_BATCHES,
	ROLLUP_COMPACTION_LAG_MS,
	ROLLUP_COMPACTION_MAX_ROWS_PER_RUN,
} from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";
import { internalIncrementDailyMetric } from "../helpers/incrementDailyMetric";
import { internalMergeMetricRollupIncrements } from "../../shared/utils/metricAggregationUtils.js";

// UTILS
import { utcRollupBucketEnd } from "../../shared/utils/analyticsDateRangeUtils.js";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

// TYPES
import type { Doc } from "../_generated/dataModel";
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";

/**
 * Collapse sharded rollup rows on cold buckets into a single shard-0 row.
 *
 * Shards exist to spread write contention, but buckets whose window has
 * closed never receive another concurrent write — keeping them sharded only
 * multiplies every future read by the shard count. This cron merges shard>0
 * rows (values summed, or min/max/avg-merged per the metric's aggregation)
 * into shard 0 and deletes them, so historical reads cost one row per bucket.
 *
 * Idempotent and safe with late writes: a backdated event after compaction
 * simply creates a new shard row that a later run merges again. Reads always
 * sum every shard row for a key, so totals are correct before, during, and
 * after compaction. Registered as a daily cron by registerAnalyticsCrons.
 *
 * @internal
 */
export const compactAnalyticsRollups = mutation({
	args: {
		...configReferenceFields,
		remainingBatches: v.optional(v.number()),
	},
	returns: v.object({
		compacted: v.number(),
		deleted: v.number(),
		scheduledNextBatch: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		const remainingBatches =
			args.remainingBatches ?? DEFAULT_PURGE_CATCHUP_BATCHES;
		const cutoff = Date.now() - ROLLUP_COMPACTION_LAG_MS;
		// Deletes + shard-0 merges per run stay at most 2x this, well under
		// Convex's per-mutation write limit.
		const budget = Math.min(
			config.settings.maxRollupDeletesPerRun,
			ROLLUP_COMPACTION_MAX_ROWS_PER_RUN,
		);

		// Discover shard values via index seeks instead of scanning: compacted
		// rows live on shard 0, so they never reappear here, and each run reads
		// only genuinely uncompacted rows.
		const rows: Doc<"analyticsDailyMetrics">[] = [];
		let shardCursor = 0;
		let sawFullShardRead = false;

		while (rows.length < budget) {
			const nextShardRow = await ctx.db
				.query("analyticsDailyMetrics")
				.withIndex("by_shard_bucket_start", (q) => q.gt("shard", shardCursor))
				.first();

			if (!nextShardRow || nextShardRow.shard === undefined) break;
			const shard = nextShardRow.shard;

			const shardRows = await ctx.db
				.query("analyticsDailyMetrics")
				.withIndex("by_shard_bucket_start", (q) =>
					q.eq("shard", shard).lt("bucketStart", cutoff),
				)
				.take(budget - rows.length);

			if (shardRows.length === budget - rows.length) {
				sawFullShardRead = true;
			}

			// Skip rows whose bucket window is still open (today's day buckets
			// within the lag, the current month's row) — live writes still land
			// there and compacting them would contend with those writes.
			for (const row of shardRows) {
				if (utcRollupBucketEnd(row.granularity, row.bucketStart) <= cutoff) {
					rows.push(row);
				}
			}

			shardCursor = shard;
		}

		if (rows.length === 0) {
			return { compacted: 0, deleted: 0, scheduledNextBatch: false };
		}

		// Merge per rollup key with the exact same semantics as live writes,
		// then apply onto the shard-0 row and delete the shard rows.
		const groups = new Map<
			string,
			{ increment: typesMetricRollupIncrement; rows: Doc<"analyticsDailyMetrics">[] }
		>();

		for (const row of rows) {
			const metricConfig = config.metricByName.get(row.metric);
			// Metrics no longer in the config have no aggregation to merge by;
			// leave their rows untouched.
			if (!metricConfig) continue;

			const key = [
				row.metric,
				row.granularity,
				row.bucketStart,
				row.scopeType,
				row.scopeId,
				row.dimensionKey,
				row.dimensionValue,
			].join(":");

			const source = {
				aggregation: metricConfig.aggregation,
				delta: row.value,
				sampleCountDelta: row.sampleCount,
			};

			const existing = groups.get(key);
			if (existing) {
				internalMergeMetricRollupIncrements(existing.increment, source);
				existing.rows.push(row);
				continue;
			}

			groups.set(key, {
				increment: {
					metric: row.metric,
					granularity: row.granularity,
					bucketStart: row.bucketStart,
					scope: { scopeType: row.scopeType, scopeId: row.scopeId },
					dimensionKey: row.dimensionKey,
					dimensionValue: row.dimensionValue,
					shard: 0,
					aggregation: metricConfig.aggregation,
					delta: row.value,
					sampleCountDelta: row.sampleCount,
				},
				rows: [row],
			});
		}

		let deleted = 0;
		for (const group of groups.values()) {
			await internalIncrementDailyMetric(ctx, group.increment);
			for (const row of group.rows) {
				await ctx.db.delete("analyticsDailyMetrics", row._id);
				deleted += 1;
			}
		}

		const scheduledNextBatch = sawFullShardRead && remainingBatches > 0;
		if (scheduledNextBatch) {
			await ctx.scheduler.runAfter(0, api.lib.compactAnalyticsRollups, {
				configHash: config.configHash!,
				remainingBatches: remainingBatches - 1,
			});
		}

		return {
			compacted: groups.size,
			deleted,
			scheduledNextBatch,
		};
	},
});
