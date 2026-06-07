// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { claimUniqueEvent, withoutUniqueClaim } from "../helpers/claimUniqueEvent";
import { prepareTrackEvent } from "../helpers/prepareTrackEvent";

// VALIDATIONS
import { validateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
	trackEventInputFields,
	trackEventInputValidator,
} from "../schemas/schemas";

// TYPES
import type {
	typesPreparedTrackEventInput,
	typesTrackEventInput,
} from "../types/types";

/**
 * Validate and schedule one or more analytics events.
 *
 * Accepts either a single event (via `name` + fields) or a batch (via
 * `events` array). Returns immediately after scheduling. The actual DB
 * insert and rollup aggregation happen asynchronously via an internal
 * mutation. Idempotency keys prevent double-counting on retries.
 *
 * @example
 * // Single event
 * await ctx.runMutation(components.analytics.lib.writeTrack, {
 *   name: "feature.used",
 *   actorId: user._id,
 *   properties: { feature: "search" },
 * });
 *
 * // Batch
 * await ctx.runMutation(components.analytics.lib.writeTrack, {
 *   events: [
 *     { name: "page.viewed", properties: { path: "/" } },
 *     { name: "feature.used", properties: { feature: "export" } },
 *   ],
 * });
 */
export const writeTrack = mutation({
	args: {
		config: analyticsRuntimeConfigValidator,
		name: v.optional(v.string()),
		...trackEventInputFields,
		events: v.optional(v.array(trackEventInputValidator)),
	},
	returns: v.object({
		scheduled: v.boolean(),
		scheduledCount: v.number(),
		deduped: v.optional(v.boolean()),
		dedupedCount: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const config = normalizeConfig(args.config);

		if (args.events) {
			validateTrackBatchLimits(args.events.length);

			const events = args.events.map((input) =>
				prepareTrackEvent(config, input),
			);
			const acceptedEvents: typesPreparedTrackEventInput[] = [];
			let dedupedCount = 0;

			for (const event of events) {
				const claim = await claimUniqueEvent(ctx, event);
				if (!claim.claimed) {
					dedupedCount += 1;
					continue;
				}

				acceptedEvents.push(withoutUniqueClaim(event));
			}

			if (acceptedEvents.length === 0) {
				return {
					scheduled: false,
					scheduledCount: 0,
					...(dedupedCount > 0 ? { deduped: true, dedupedCount } : {}),
				};
			}

			await ctx.scheduler.runAfter(
				0,
				internal.helpers.writeAnalyticsEvent.writeAnalyticsEvent,
				{
					config: args.config,
					events: acceptedEvents,
				},
			);

			return {
				scheduled: true,
				scheduledCount: acceptedEvents.length,
				...(dedupedCount > 0 ? { deduped: true, dedupedCount } : {}),
			};
		}

		if (!args.name) {
			throw new Error('writeTrack requires either "name" or "events".');
		}

		const input: typesTrackEventInput = {
			name: args.name,
			occurredAt: args.occurredAt,
			actorId: args.actorId,
			organizationId: args.organizationId,
			subject: args.subject,
			scopes: args.scopes,
			properties: args.properties,
			source: args.source,
			unique: args.unique,
		};

		const event = prepareTrackEvent(config, input);
		const claim = await claimUniqueEvent(ctx, event);

		if (!claim.claimed) {
			return {
				scheduled: false,
				scheduledCount: 0,
				deduped: true,
				dedupedCount: 1,
			};
		}

		await ctx.scheduler.runAfter(
			0,
			internal.helpers.writeAnalyticsEvent.writeAnalyticsEvent,
			{
				config: args.config,
				...withoutUniqueClaim(event),
			},
		);

		return {
			scheduled: true,
			scheduledCount: 1,
		};
	},
});
