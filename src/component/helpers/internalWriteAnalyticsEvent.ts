// LIBRARIES
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// CONFIG
import { internalNormalizeConfig } from "../analyticsConfig";

// HELPERS
import { internalAggregateEvent } from "./aggregateEvent";
import { internalClaimUniqueEvent } from "./claimUniqueEvent";
import {
	internalBuildAggregateInput,
	internalBuildAnalyticsEventInsert,
} from "../utils/analyticsEventPayloads";

// UTILS
import {
	internalHasHighVolumeMetrics,
	internalGetHighVolumeEventNames,
} from "../utils/shared/metricUtils";
import { internalValidateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
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
} from "../../shared/types/index.js";

async function _writeSingle(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	args: any,
): Promise<{
	eventId?: any;
	duplicate: boolean;
	deduped?: boolean;
	highVolumeStatus?: typesHighVolumeStatus;
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

	const uniqueClaim = await internalClaimUniqueEvent(ctx, args);
	if (!uniqueClaim.claimed) {
		return {
			duplicate: true,
			deduped: true,
			highVolumeStatus: "none",
		};
	}

	const highVolumeStatus: typesHighVolumeStatus = internalHasHighVolumeMetrics(
		config,
		name,
	)
		? "pending"
		: "none";

	const eventId = await ctx.db.insert(
		"analyticsEvents",
		internalBuildAnalyticsEventInsert(args, highVolumeStatus),
	);

	await internalAggregateEvent(
		ctx,
		config,
		internalBuildAggregateInput(eventId, args),
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
	dedupedCount: number;
	pendingHighVolume: number;
}> {
	internalValidateTrackBatchLimits(events.length);

	const highVolumeEventNames = internalGetHighVolumeEventNames(config);
	const seenIdempotencyKeys = new Set<string>();
	const aggregateInputs: typesAnalyticsAggregateEventInput[] = [];

	let duplicates = 0;
	let dedupedCount = 0;
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

		const uniqueClaim = await internalClaimUniqueEvent(ctx, event);
		if (!uniqueClaim.claimed) {
			duplicates += 1;
			dedupedCount += 1;
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
			internalBuildAnalyticsEventInsert(event, highVolumeStatus),
		);

		aggregateInputs.push(internalBuildAggregateInput(eventId, event));
	}

	await internalAggregateEvent(ctx, config, aggregateInputs, "realtime");

	return {
		inserted: aggregateInputs.length,
		duplicates,
		dedupedCount,
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
export const internalWriteAnalyticsEvent = internalMutation({
	args: {
		config: analyticsRuntimeConfigValidator,
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
		deduped: v.optional(v.boolean()),
		highVolumeStatus: v.optional(
			v.union(v.literal("none"), v.literal("pending"), v.literal("processed")),
		),

		// Batch
		inserted: v.optional(v.number()),
		duplicates: v.optional(v.number()),
		dedupedCount: v.optional(v.number()),
		pendingHighVolume: v.optional(v.number()),
	}),
	handler: async (ctx, args) => {
		const config = internalNormalizeConfig(args.config);

		if (args.events) {
			return _writeBatch(ctx, config, args.events);
		}

		if (!args.name) {
			throw new Error(
				'internalWriteAnalyticsEvent requires either "name" or "events".',
			);
		}

		return _writeSingle(ctx, config, args as any);
	},
});
