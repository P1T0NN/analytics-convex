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

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

const DELETABLE_HIGH_VOLUME_STATUSES = [
	undefined,
	"none",
	"processed",
] as const;

/**
 * Delete raw events past the retention window.
 *
 * Deletes up to maxRawEventDeletesPerRun events per call. Skips events
 * still pending high-volume aggregation. Registered as a daily cron
 * by registerAnalyticsCrons.
 *
 * @internal
 */
export const purgeStaleAnalyticsEvents = mutation({
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

		if (config.settings.rawEventRetentionDays <= 0) {
			return { deleted: 0, skipped: true, scheduledNextBatch: false };
		}

		const remainingBatches =
			args.remainingBatches ?? DEFAULT_PURGE_CATCHUP_BATCHES;
		const cutoff = Date.now() - config.settings.rawEventRetentionDays * DAY_MS;
		let deleted = 0;

		for (const status of DELETABLE_HIGH_VOLUME_STATUSES) {
			const remaining = config.settings.maxRawEventDeletesPerRun - deleted;
			if (remaining <= 0) break;

			const rows = await ctx.db
				.query("analyticsEvents")
				.withIndex("by_high_volume_status_occurred_at", (q) =>
					q.eq("highVolumeStatus", status).lt("occurredAt", cutoff),
				)
				.take(remaining);

			for (const row of rows) {
				await ctx.db.delete("analyticsEvents", row._id);
				deleted += 1;
			}
		}

		// A full batch means more stale rows likely remain — keep going now
		// instead of waiting for the next cron tick, bounded by remainingBatches.
		const scheduledNextBatch =
			deleted >= config.settings.maxRawEventDeletesPerRun &&
			remainingBatches > 0;

		if (scheduledNextBatch) {
			await ctx.scheduler.runAfter(0, api.lib.purgeStaleAnalyticsEvents, {
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
