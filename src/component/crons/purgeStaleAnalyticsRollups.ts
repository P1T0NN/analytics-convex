// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// CONSTANTS
import {
	DAY_MS,
	DEFAULT_PURGE_CATCHUP_BATCHES,
} from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// UTILS
import {
	startOfUtcDay,
	utcRollupBucketEnd,
} from "../../shared/utils/analyticsDateRangeUtils.js";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

/**
 * Delete daily rollup rows past the retention window.
 *
 * Deletes up to maxRollupDeletesPerRun rows per call. Skipped when
 * rollupRetentionDays is 0 (keep rollups forever). Registered as a daily cron
 * by registerAnalyticsCrons.
 *
 * @internal
 */
export const purgeStaleAnalyticsRollups = mutation({
	args: {
		...configReferenceFields,
		remainingBatches: v.optional(v.number()),
	},
	returns: v.object({
		deleted: v.number(),
		cutoff: v.optional(v.number()),
		skipped: v.boolean(),
		scheduledNextBatch: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		if (config.settings.rollupRetentionDays <= 0) {
			return { deleted: 0, skipped: true, scheduledNextBatch: false };
		}

		const remainingBatches =
			args.remainingBatches ?? DEFAULT_PURGE_CATCHUP_BATCHES;

		const cutoff = startOfUtcDay(
			Date.now() - config.settings.rollupRetentionDays * DAY_MS,
		);

		// One delete budget shared across all three tables, so a single run's
		// writes stay well under Convex's per-mutation write limit. Catch-up
		// batches (below) preserve throughput.
		let remaining = config.settings.maxRollupDeletesPerRun;
		let deleted = 0;
		let sawFullBatch = false;

		const rows = await ctx.db
			.query("analyticsDailyMetrics")
			.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
			.take(remaining);
		sawFullBatch ||= rows.length === remaining;

		// A month row's bucketStart passes the cutoff while some of its days
		// are still inside retention. Deleting it early would make decomposed
		// reads lose the surviving days, so month rows wait until the whole
		// month is stale.
		for (const row of rows) {
			if (utcRollupBucketEnd(row.granularity, row.bucketStart) > cutoff) {
				continue;
			}
			await ctx.db.delete("analyticsDailyMetrics", row._id);
			deleted += 1;
			remaining -= 1;
		}

		if (remaining > 0) {
			const claimRows = await ctx.db
				.query("analyticsDailyActorClaims")
				.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
				.take(remaining);
			sawFullBatch ||= claimRows.length === remaining;

			for (const row of claimRows) {
				// Month-tier claims wait until their whole month is stale, like
				// month rollup rows.
				if (
					utcRollupBucketEnd(row.granularity ?? "day", row.bucketStart) >
					cutoff
				) {
					continue;
				}
				await ctx.db.delete("analyticsDailyActorClaims", row._id);
				deleted += 1;
				remaining -= 1;
			}
		}

		if (remaining > 0) {
			const journeyClaimRows = await ctx.db
				.query("analyticsJourneyStepClaims")
				.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
				.take(remaining);
			sawFullBatch ||= journeyClaimRows.length === remaining;

			for (const row of journeyClaimRows) {
				await ctx.db.delete("analyticsJourneyStepClaims", row._id);
				deleted += 1;
				remaining -= 1;
			}
		}

		const scheduledNextBatch = sawFullBatch && remainingBatches > 0;

		if (scheduledNextBatch) {
			await ctx.scheduler.runAfter(0, api.lib.purgeStaleAnalyticsRollups, {
				configHash: config.configHash!,
				remainingBatches: remainingBatches - 1,
			});
		}

		return {
			deleted,
			cutoff,
			skipped: false,
			scheduledNextBatch,
		};
	},
});
