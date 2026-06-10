// LIBRARIES
import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";

// HELPERS
import { internalAggregateEvent } from "./aggregateEvent";
import { internalClaimUniqueEvent } from "./claimUniqueEvent";
import { internalEnsureConfiguration } from "./resolveConfiguration";
import {
	internalBuildAggregateInput,
	internalBuildAnalyticsEventInsert,
} from "../utils/analyticsEventPayloads";

// UTILS
import { internalGetHighVolumeEventNames } from "../utils/shared/metricUtils";
import { internalValidateTrackBatchLimits } from "../validations/eventInputLimits";

// SCHEMAS
import {
	configReferenceFields,
	preparedTrackEventInputValidator,
} from "../schemas/schemas";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesHighVolumeStatus,
} from "../../shared/types/primitives.js";
import type {
	typesPreparedTrackEventInput,
} from "../../shared/types/tracking.js";

async function internalLookupExistingIdempotencyKey(
	ctx: MutationCtx,
	idempotencyKey: string,
) {
	return await ctx.db
		.query("analyticsEvents")
		.withIndex("by_idempotency_key", (q) =>
			q.eq("idempotencyKey", idempotencyKey),
		)
		.first();
}

async function _writeBatch(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	events: typesPreparedTrackEventInput[],
): Promise<{
	inserted: number;
	duplicates: number;
	dedupedCount: number;
	pendingHighVolume: number;
}> {
	internalValidateTrackBatchLimits(events.length);

	const highVolumeEventNames = internalGetHighVolumeEventNames(config);
	const seenIdempotencyKeys = new Set<string>();
	const candidates: typesPreparedTrackEventInput[] = [];

	let duplicates = 0;

	for (const event of events) {
		if (seenIdempotencyKeys.has(event.idempotencyKey)) {
			duplicates += 1;
			continue;
		}
		seenIdempotencyKeys.add(event.idempotencyKey);
		candidates.push(event);
	}

	const existingRows = await Promise.all(
		candidates.map((event) =>
			internalLookupExistingIdempotencyKey(ctx, event.idempotencyKey),
		),
	);

	const pendingCandidates: typesPreparedTrackEventInput[] = [];
	for (let index = 0; index < candidates.length; index += 1) {
		if (existingRows[index]) {
			duplicates += 1;
			continue;
		}
		pendingCandidates.push(candidates[index]!);
	}

	const claimResults = await Promise.all(
		pendingCandidates.map((event) => internalClaimUniqueEvent(ctx, event)),
	);

	const acceptedEvents: typesPreparedTrackEventInput[] = [];
	let dedupedCount = 0;

	for (let index = 0; index < pendingCandidates.length; index += 1) {
		if (!claimResults[index]?.claimed) {
			duplicates += 1;
			dedupedCount += 1;
			continue;
		}
		acceptedEvents.push(pendingCandidates[index]!);
	}

	const aggregateInputs: typesAnalyticsAggregateEventInput[] = [];
	let pendingHighVolume = 0;

	for (const event of acceptedEvents) {
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
 * Inserts a batch of events with dedup, insert, and merged aggregation.
 *
 * @internal
 */
export const internalWriteAnalyticsEvent = internalMutation({
	args: {
		...configReferenceFields,
		events: v.array(preparedTrackEventInputValidator),
	},
	returns: v.object({
		inserted: v.number(),
		duplicates: v.number(),
		dedupedCount: v.number(),
		pendingHighVolume: v.number(),
	}),
	handler: async (ctx, args) => {
		const config = await internalEnsureConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		if (args.events.length === 0) {
			throw new ConvexError({
				code: "BAD_REQUEST",
				message: "internalWriteAnalyticsEvent requires at least one event.",
			});
		}

		return _writeBatch(ctx, config, args.events);
	},
});
