// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// HELPERS
import { internalClaimUniqueEvent, internalWithoutUniqueClaim } from "../helpers/claimUniqueEvent";
import { internalPrepareTrackEvent } from "../helpers/prepareTrackEvent";
import { internalEnsureConfiguration } from "../helpers/resolveConfiguration";

// VALIDATIONS
import { internalValidateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import {
	configReferenceFields,
	trackEventInputValidator,
} from "../schemas/schemas";

// TYPES
import type {
	typesPreparedTrackEventInput,
} from "../../shared/types/tracking.js";

/**
 * Validate and schedule one or more analytics events.
 *
 * Accepts a batch via the `events` array. Returns immediately after
 * scheduling. The actual DB insert and rollup aggregation happen
 * asynchronously via an internal mutation. Idempotency keys prevent
 * double-counting on retries.
 *
 * @example
 * await ctx.runMutation(components.analytics.lib.writeTrack, {
 *   configHash: analytics.config.configHash,
 *   config: analytics.config,
 *   events: [
 *     { name: "page.viewed", properties: { path: "/" } },
 *     { name: "feature.used", properties: { feature: "export" } },
 *   ],
 * });
 */
export const writeTrack = mutation({
	args: {
		...configReferenceFields,
		events: v.array(trackEventInputValidator),
	},
	returns: v.object({
		scheduled: v.boolean(),
		scheduledCount: v.number(),
		deduped: v.optional(v.boolean()),
		dedupedCount: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const config = await internalEnsureConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		internalValidateTrackBatchLimits(args.events.length);

		const events = args.events.map((input, index) =>
			internalPrepareTrackEvent(config, input, index),
		);

		const seenUniqueKeys = new Set<string>();
		const eventsToClaim: typesPreparedTrackEventInput[] = [];
		let dedupedCount = 0;

		for (const event of events) {
			const uniqueKey = event.unique?.key;
			if (uniqueKey) {
				if (seenUniqueKeys.has(uniqueKey)) {
					dedupedCount += 1;
					continue;
				}
				seenUniqueKeys.add(uniqueKey);
			}
			eventsToClaim.push(event);
		}

		const claimResults = await Promise.all(
			eventsToClaim.map((event) => internalClaimUniqueEvent(ctx, event)),
		);

		const acceptedEvents: typesPreparedTrackEventInput[] = [];

		for (let index = 0; index < eventsToClaim.length; index += 1) {
			if (!claimResults[index]?.claimed) {
				dedupedCount += 1;
				continue;
			}

			acceptedEvents.push(internalWithoutUniqueClaim(eventsToClaim[index]!));
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
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				configHash: config.configHash!,
				events: acceptedEvents,
			},
		);

		return {
			scheduled: true,
			scheduledCount: acceptedEvents.length,
			...(dedupedCount > 0 ? { deduped: true, dedupedCount } : {}),
		};
	},
});
