// LIBRARIES
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// CONFIG
import { getConfig } from "../analyticsConfig";

// HELPERS
import { aggregateEvent } from "./aggregateEvent";
import { buildAggregateInput } from "../utils/buildAggregateInput";
import { buildAnalyticsEventInsert } from "../utils/buildAnalyticsEventInsert";

// UTILS
import {
	hasHighVolumeMetrics,
	getHighVolumeEventNames,
} from "../utils/shared/metricUtils";
import { validateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import {
	preparedTrackEventInputFields,
	preparedTrackEventInputValidator,
	propertyValueValidator,
	sourceValidator,
} from "../schemas/schemas";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesHighVolumeStatus,
} from "../types/types";

async function _writeSingle(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	args: any,
): Promise<{
	eventId: any;
	duplicate: boolean;
	highVolumeStatus: typesHighVolumeStatus;
}> {
	const { name, idempotencyKey } = args as any;

	const existing = await ctx.db
		.query("analyticsEvents")
		.withIndex("by_idempotency_key", (q) =>
			q.eq("idempotencyKey", idempotencyKey),
		)
		.first();

	if (existing) {
		const highVolumeStatus: typesHighVolumeStatus =
			existing.highVolumeStatus ?? "none";

		return {
			eventId: existing._id,
			duplicate: true,
			highVolumeStatus,
		};
	}

	const highVolumeStatus: typesHighVolumeStatus = hasHighVolumeMetrics(
		config,
		name,
	)
		? "pending"
		: "none";

	const eventId = await ctx.db.insert(
		"analyticsEvents",
		buildAnalyticsEventInsert(args, highVolumeStatus),
	);

	await aggregateEvent(
		ctx,
		config,
		buildAggregateInput(eventId, args),
		"realtime",
	);

	return {
		eventId,
		duplicate: false,
		highVolumeStatus,
	};
}

async function _writeBatch(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	events: any[],
): Promise<{
	inserted: number;
	duplicates: number;
	pendingHighVolume: number;
}> {
	validateTrackBatchLimits(events.length);

	const highVolumeEventNames = getHighVolumeEventNames(config);
	const seenIdempotencyKeys = new Set<string>();
	const aggregateInputs: typesAnalyticsAggregateEventInput[] = [];

	let duplicates = 0;
	let pendingHighVolume = 0;

	for (const event of events) {
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

		const eventId = await ctx.db.insert(
			"analyticsEvents",
			buildAnalyticsEventInsert(event, highVolumeStatus),
		);

		aggregateInputs.push(buildAggregateInput(eventId, event));
	}

	await aggregateEvent(ctx, config, aggregateInputs, "realtime");

	return {
		inserted: aggregateInputs.length,
		duplicates,
		pendingHighVolume,
	};
}

/**
 * Internal mutation. Do not call directly.
 *
 * Inserts a single event (with dedup, insert, aggregate) or a batch
 * of events (with merged increments for efficiency).
 *
 * @internal
 */
export const writeAnalyticsEvent = internalMutation({
	args: {
		...preparedTrackEventInputFields,
		name: v.optional(v.string()),
		occurredAt: v.optional(v.number()),
		properties: v.optional(v.record(v.string(), propertyValueValidator)),
		source: v.optional(sourceValidator),
		idempotencyKey: v.optional(v.string()),
		events: v.optional(v.array(preparedTrackEventInputValidator)),
	},
	returns: v.object({
		// Single
		eventId: v.optional(v.id("analyticsEvents")),
		duplicate: v.optional(v.boolean()),
		highVolumeStatus: v.optional(
			v.union(v.literal("none"), v.literal("pending"), v.literal("processed")),
		),

		// Batch
		inserted: v.optional(v.number()),
		duplicates: v.optional(v.number()),
		pendingHighVolume: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const config = await getConfig(ctx);

		if (args.events) {
			return _writeBatch(ctx, config, args.events);
		}

		if (!args.name) {
			throw new Error(
				'writeAnalyticsEvent requires either "name" or "events".',
			);
		}

		return _writeSingle(ctx, config, args as any);
	},
});
