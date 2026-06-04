// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// CONFIG
import { getConfig } from "../analyticsConfig";

// HELPERS
import { prepareTrackEvent } from "../helpers/prepareTrackEvent";

// SCHEMAS
import {
	subjectValidator,
	scopeValidator,
	propertyValueValidator,
	sourceValidator,
} from "../schemas/schemas";

/**
 * Validate and schedule an analytics event.
 *
 * Returns immediately after scheduling. The actual DB insert and rollup
 * aggregation happen asynchronously via an internal mutation. Idempotency
 * keys prevent double-counting on retries.
 *
 * @example
 * await ctx.runMutation(components.analytics.lib.writeTrack, {
 *   name: "feature.used",
 *   actorId: user._id,
 *   properties: { feature: "search" },
 * });
 */
export const writeTrack = mutation({
	args: {
		name: v.string(),
		occurredAt: v.optional(v.number()),
		actorId: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		subject: v.optional(subjectValidator),
		scopes: v.optional(v.array(scopeValidator)),
		properties: v.optional(v.record(v.string(), propertyValueValidator)),
		source: v.optional(sourceValidator),
	},
	returns: v.object({
		scheduled: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = await getConfig(ctx);
		const event = prepareTrackEvent(config, args);

		await ctx.scheduler.runAfter(0, internal.lib.writeAnalyticsEvent, {
			...event,
		});

		return {
			scheduled: true,
		};
	},
});
