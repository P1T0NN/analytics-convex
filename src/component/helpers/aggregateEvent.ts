// HELPERS
import { internalIncrementDailyMetric } from "./incrementDailyMetric";
import { internalClaimDailyActorRollup } from "./claimDailyActorRollup";
import { internalClaimJourneyStep } from "./claimJourneyStep";

// UTILS
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils.js";
import {
	internalIsDistinctActorsMetric,
	internalShouldAggregateMetric,
} from "../utils/shared/metricUtils";
import { internalGetScopesForEvent } from "../utils/shared/scopeUtils";
import { internalGetRollupIncrementKey } from "../utils/getRollupIncrementKey";
import { internalGetMetricRollupIncrements } from "../utils/getMetricRollupIncrements";
import { internalGetDistinctActorRollupTargets } from "../utils/getDistinctActorRollupTargets";
import { internalBuildDailyActorClaimKey } from "../utils/buildDailyActorClaimKey";
import { internalMergeMetricRollupIncrements } from "../../shared/utils/metricAggregationUtils.js";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type { typesRollupMode } from "../../shared/types/primitives.js";
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";
import type { typesDistinctActorRollupTarget } from "../utils/getDistinctActorRollupTargets";
import { internalGetJourneyStepTargets } from "../utils/getJourneyStepTargets";
import type { typesJourneyStepTarget } from "../utils/getJourneyStepTargets";

/**
 * Claim journey steps in step order per (journey, scope, actor) chain.
 *
 * Claiming a step requires the previous step's claim to already exist, so
 * steps of the same chain must not race each other inside one batch.
 * Independent chains still run concurrently.
 */
async function claimJourneyStepsInOrder(
	ctx: MutationCtx,
	targets: typesJourneyStepTarget[],
) {
	const chains = new Map<string, typesJourneyStepTarget[]>();

	for (const target of targets) {
		const chainKey = [
			target.journey,
			target.scope.scopeType,
			target.scope.scopeId,
			target.actorKey,
		].join(":");
		const chain = chains.get(chainKey) ?? [];
		chain.push(target);
		chains.set(chainKey, chain);
	}

	await Promise.all(
		[...chains.values()].map(async (chain) => {
			chain.sort(
				(a, b) => a.stepIndex - b.stepIndex || a.bucketStart - b.bucketStart,
			);
			for (const target of chain) {
				await internalClaimJourneyStep(ctx, target);
			}
		}),
	);
}

export type typesAggregatePlan = {
	increments: typesMetricRollupIncrement[];
	distinctTargets: typesDistinctActorRollupTarget[];
	journeyTargets: typesJourneyStepTarget[];
	/** Upper bound on document writes applying this plan can perform. */
	plannedWrites: number;
};

/**
 * Build the merged write plan for a batch without touching the database.
 *
 * Increments are merged per rollup row, so a batch touching the same
 * metric/scope/dimension/bucket performs one read and one write per row
 * instead of one per event. `plannedWrites` lets callers shrink a batch
 * before applying so a single mutation never approaches Convex write limits.
 */
export function internalPlanAggregateEvent(
	config: typesAnalyticsConfigState,
	events: typesAnalyticsAggregateEventInput[],
	mode: typesRollupMode,
): typesAggregatePlan {
	const incrementsByKey = new Map<string, typesMetricRollupIncrement>();
	const distinctTargetsByKey = new Map<string, typesDistinctActorRollupTarget>();
	const journeyTargetsByKey = new Map<string, typesJourneyStepTarget>();

	for (const event of events) {
		const bucketStart = startOfUtcDay(event.occurredAt);
		const scopes = internalGetScopesForEvent(event);

		for (const target of internalGetJourneyStepTargets(config, event)) {
			journeyTargetsByKey.set(internalBuildJourneyTargetDedupeKey(target), target);
		}

		for (const metric of config.metrics) {
			if (!internalShouldAggregateMetric(config, event, metric, mode)) continue;

			if (internalIsDistinctActorsMetric(metric)) {
				for (const target of internalGetDistinctActorRollupTargets(
					event,
					metric,
					bucketStart,
					scopes,
				)) {
					distinctTargetsByKey.set(
						internalBuildDailyActorClaimKey(target),
						target,
					);
				}
				continue;
			}

			for (const increment of internalGetMetricRollupIncrements(
				config,
				event,
				metric,
				undefined,
				scopes,
			)) {
				const key = internalGetRollupIncrementKey(increment);
				const existing = incrementsByKey.get(key);

				if (existing) {
					internalMergeMetricRollupIncrements(existing, increment);
					continue;
				}

				incrementsByKey.set(key, { ...increment });
			}
		}
	}

	const increments = [...incrementsByKey.values()];
	const distinctTargets = [...distinctTargetsByKey.values()];
	const journeyTargets = [...journeyTargetsByKey.values()];

	return {
		increments,
		distinctTargets,
		journeyTargets,
		// Per distinct target: day claim + month claim + rollup increment.
		plannedWrites:
			increments.length + distinctTargets.length * 3 + journeyTargets.length,
	};
}

export async function internalApplyAggregatePlan(
	ctx: MutationCtx,
	plan: typesAggregatePlan,
) {
	await Promise.all([
		...plan.increments.map((increment) =>
			internalIncrementDailyMetric(ctx, increment),
		),
		...plan.distinctTargets.map((target) =>
			internalClaimDailyActorRollup(ctx, target),
		),
		claimJourneyStepsInOrder(ctx, plan.journeyTargets),
	]);
}

/** Plan and apply in one step — the path for bounded (≤100 event) batches. */
export async function internalAggregateEvent(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	events: typesAnalyticsAggregateEventInput[],
	mode: typesRollupMode,
) {
	await internalApplyAggregatePlan(
		ctx,
		internalPlanAggregateEvent(config, events, mode),
	);
}

function internalBuildJourneyTargetDedupeKey(target: typesJourneyStepTarget) {
	return [
		target.journey,
		target.scope.scopeType,
		target.scope.scopeId,
		target.bucketStart,
		target.stepIndex,
		target.actorKey,
	].join(":");
}
