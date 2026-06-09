// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// HELPERS
import { internalNormalizeConfig } from "../analyticsConfig";
import { internalAggregateEvent } from "../helpers/aggregateEvent";

// UTILS
import { internalToAggregateInput } from "../utils/analyticsEventPayloads";

// SCHEMAS
import { analyticsRuntimeConfigValidator } from "../schemas/schemas";

/**
 * Batch-aggregate pending high-volume events.
 *
 * Processes up to highVolumeBatchSize pending events per call. Schedules
 * itself again if the batch was full and catchup batches remain. Registered
 * as a cron by registerAnalyticsCrons.
 *
 * @internal
 */
export const processPendingHighVolumeAnalyticsEvents = mutation({
	args: {
		config: analyticsRuntimeConfigValidator,
		remainingCatchupBatches: v.optional(v.number()),
	},
	returns: v.object({
		processed: v.number(),
		scheduledNextBatch: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = internalNormalizeConfig(args.config);
		const remainingCatchupBatches =
			args.remainingCatchupBatches ??
			config.settings.highVolumeMaxCatchupBatches;

		const pendingEvents = await ctx.db
			.query("analyticsEvents")
			.withIndex("by_high_volume_status_occurred_at", (q) =>
				q.eq("highVolumeStatus", "pending"),
			)
			.take(config.settings.highVolumeBatchSize);

		if (pendingEvents.length === 0) {
			return {
				processed: 0,
				scheduledNextBatch: false,
			};
		}

		await internalAggregateEvent(
			ctx,
			config,
			pendingEvents.map((event) => internalToAggregateInput(event)),
			"highVolume",
		);

		const now = Date.now();
		for (const event of pendingEvents) {
			await ctx.db.patch("analyticsEvents", event._id, {
				highVolumeStatus: "processed",
				highVolumeAggregatedAt: now,
			});
		}

		const shouldContinue =
			pendingEvents.length === config.settings.highVolumeBatchSize &&
			remainingCatchupBatches > 0;

		if (shouldContinue) {
			await ctx.scheduler.runAfter(
				0,
				api.lib.processPendingHighVolumeAnalyticsEvents,
				{
					config: args.config,
					remainingCatchupBatches: remainingCatchupBatches - 1,
				},
			);
		}

		return {
			processed: pendingEvents.length,
			scheduledNextBatch: shouldContinue,
		};
	},
});
