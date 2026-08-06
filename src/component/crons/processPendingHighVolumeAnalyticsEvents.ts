// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// CONSTANTS
import { ANALYTICS_WRITE_BUDGET_CEILING } from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";
import {
	internalApplyAggregatePlan,
	internalPlanAggregateEvent,
} from "../helpers/aggregateEvent";

// UTILS
import { internalToAggregateInput } from "../utils/analyticsEventPayloads";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

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
		...configReferenceFields,
		remainingCatchupBatches: v.optional(v.number()),
	},
	returns: v.object({
		processed: v.number(),
		scheduledNextBatch: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
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

		// Adaptive batch sizing: plan the merged writes first (pure CPU) and
		// halve the batch until planned writes plus status patches fit the
		// write budget. Pathological configs (every event a unique dimension
		// value across many scopes) shrink the batch instead of blowing past
		// Convex's per-mutation write limit; leftovers stay pending for the
		// next self-scheduled batch.
		let batch = pendingEvents;
		let plan = internalPlanAggregateEvent(
			config,
			batch.map((event) => internalToAggregateInput(event)),
			"highVolume",
		);
		while (
			batch.length > 1 &&
			plan.plannedWrites + batch.length > ANALYTICS_WRITE_BUDGET_CEILING
		) {
			batch = batch.slice(0, Math.ceil(batch.length / 2));
			plan = internalPlanAggregateEvent(
				config,
				batch.map((event) => internalToAggregateInput(event)),
				"highVolume",
			);
		}

		await internalApplyAggregatePlan(ctx, plan);

		const now = Date.now();
		for (const event of batch) {
			await ctx.db.patch("analyticsEvents", event._id, {
				highVolumeStatus: "processed",
				highVolumeAggregatedAt: now,
			});
		}

		const shouldContinue =
			(pendingEvents.length === config.settings.highVolumeBatchSize ||
				batch.length < pendingEvents.length) &&
			remainingCatchupBatches > 0;

		if (shouldContinue) {
			await ctx.scheduler.runAfter(
				0,
				api.lib.processPendingHighVolumeAnalyticsEvents,
				{
					configHash: config.configHash!,
					remainingCatchupBatches: remainingCatchupBatches - 1,
				},
			);
		}

		return {
			processed: batch.length,
			scheduledNextBatch: shouldContinue,
		};
	},
});
