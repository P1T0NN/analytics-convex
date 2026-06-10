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
		const rows = await ctx.db
			.query("analyticsDailyMetrics")
			.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
			.take(config.settings.maxRollupDeletesPerRun);

		for (const row of rows) {
			await ctx.db.delete("analyticsDailyMetrics", row._id);
		}

		const claimRows = await ctx.db
			.query("analyticsDailyActorClaims")
			.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
			.take(config.settings.maxRollupDeletesPerRun);

		for (const row of claimRows) {
			await ctx.db.delete("analyticsDailyActorClaims", row._id);
		}

		const journeyClaimRows = await ctx.db
			.query("analyticsJourneyStepClaims")
			.withIndex("by_bucket_start", (q) => q.lt("bucketStart", cutoff))
			.take(config.settings.maxRollupDeletesPerRun);

		for (const row of journeyClaimRows) {
			await ctx.db.delete("analyticsJourneyStepClaims", row._id);
		}

		// Any table hitting its per-run cap means more stale rows likely
		// remain — keep going now instead of waiting for the next cron tick.
		const limit = config.settings.maxRollupDeletesPerRun;
		const scheduledNextBatch =
			(rows.length >= limit ||
				claimRows.length >= limit ||
				journeyClaimRows.length >= limit) &&
			remainingBatches > 0;

		if (scheduledNextBatch) {
			await ctx.scheduler.runAfter(0, api.lib.purgeStaleAnalyticsRollups, {
				configHash: config.configHash!,
				remainingBatches: remainingBatches - 1,
			});
		}

		return {
			deleted: rows.length + claimRows.length + journeyClaimRows.length,
			cutoff,
			skipped: false,
			scheduledNextBatch,
		};
	},
});
