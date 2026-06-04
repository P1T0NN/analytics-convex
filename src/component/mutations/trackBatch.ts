// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// CONFIG
import { getConfig } from "../analyticsConfig";

// HELPERS
import { prepareTrackEvent } from "../helpers/prepareTrackEvent";

// VALIDATIONS
import { validateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import { trackEventInputValidator } from "../schemas/schemas";

/**
 * Validate and schedule a bounded batch of analytics events.
 *
 * Useful for firehose-style ingestion where callers can buffer many events and
 * pay one scheduler call instead of one call per event.
 */
export const writeTrackBatch = mutation({
	args: {
		events: v.array(trackEventInputValidator),
	},
	returns: v.object({
		scheduled: v.boolean(),
		scheduledCount: v.number(),
	}),
	handler: async (ctx, args) => {
		validateTrackBatchLimits(args.events.length);

		const config = await getConfig(ctx);
		const events = args.events.map((event) =>
			prepareTrackEvent(config, event),
		);

		await ctx.scheduler.runAfter(0, internal.lib.writeAnalyticsEvents, {
			events,
		});

		return {
			scheduled: true,
			scheduledCount: events.length,
		};
	},
});
