// LIBRARIES
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// CONFIG
import { getConfig } from "../analyticsConfig";

// HELPERS
import { aggregateEvents } from "./aggregateEvent";

// UTILS
import { getHighVolumeEventNames } from "../utils/shared/metricUtils";
import { validateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import { preparedTrackEventInputValidator } from "../schemas/schemas";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsMetricScope,
	typesAnalyticsProperties,
	typesHighVolumeStatus,
} from "../types/types";

/**
 * Internal mutation. Do not call directly.
 *
 * Inserts a bounded batch of already validated analytics events, deduplicates
 * by idempotency key, and coalesces realtime rollup increments.
 *
 * @internal
 */
export const writeAnalyticsEvents = internalMutation({
	args: {
		events: v.array(preparedTrackEventInputValidator),
	},
	returns: v.object({
		inserted: v.number(),
		duplicates: v.number(),
		pendingHighVolume: v.number(),
	}),
	handler: async (ctx, args) => {
		validateTrackBatchLimits(args.events.length);

		const config = await getConfig(ctx);
		const highVolumeEventNames = getHighVolumeEventNames(config);
		const seenIdempotencyKeys = new Set<string>();
		const aggregateInputs: typesAnalyticsAggregateEventInput[] = [];
		let duplicates = 0;
		let pendingHighVolume = 0;

		for (const event of args.events) {
			if (seenIdempotencyKeys.has(event.idempotencyKey)) {
				duplicates += 1;
				continue;
			}
			seenIdempotencyKeys.add(event.idempotencyKey);

			const existing = await ctx.db
				.query("analyticsEvents")
				.withIndex("by_idempotency_key", (q) =>
					q.eq("idempotencyKey", event.idempotencyKey),
				)
				.first();

			if (existing) {
				duplicates += 1;
				continue;
			}

			const highVolumeStatus: typesHighVolumeStatus = highVolumeEventNames.has(
				event.name,
			)
				? "pending"
				: "none";

			if (highVolumeStatus === "pending") {
				pendingHighVolume += 1;
			}

			const eventId = await ctx.db.insert("analyticsEvents", {
				name: event.name,
				occurredAt: event.occurredAt,
				actorId: event.actorId,
				organizationId: event.organizationId,
				subject: event.subject,
				scopes: event.scopes as typesAnalyticsMetricScope[] | undefined,
				properties: event.properties,
				source: event.source,
				idempotencyKey: event.idempotencyKey,
				highVolumeStatus,
			});

			aggregateInputs.push({
				eventId,
				name: event.name,
				occurredAt: event.occurredAt,
				actorId: event.actorId,
				organizationId: event.organizationId,
				subject: event.subject,
				scopes: event.scopes as typesAnalyticsMetricScope[] | undefined,
				properties: event.properties as typesAnalyticsProperties,
			});
		}

		await aggregateEvents(ctx, config, aggregateInputs, "realtime");

		return {
			inserted: aggregateInputs.length,
			duplicates,
			pendingHighVolume,
		};
	},
});
