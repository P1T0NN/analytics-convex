// HELPERS
import { internalIncrementDailyMetric } from "./incrementDailyMetric";

// UTILS
import { internalBuildDailyActorClaimKey } from "../utils/buildDailyActorClaimKey";
import { startOfUtcMonth } from "../../shared/utils/analyticsDateRangeUtils.js";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type { typesDistinctActorRollupTarget } from "../utils/getDistinctActorRollupTargets";

/** Namespaced so a month claim can never collide with a day claim key. */
export function internalBuildMonthActorClaimKey(args: {
	metric: string;
	monthStart: number;
	scopeType: string;
	scopeId: string;
	dimensionKey: string;
	dimensionValue: string;
	actorKey: string;
}) {
	return [
		"monthclaim",
		args.metric,
		args.monthStart,
		args.scopeType,
		args.scopeId,
		args.dimensionKey,
		args.dimensionValue,
		args.actorKey,
	].join(":");
}

/**
 * Ensure the month-tier claim for a (metric, month, scope, dimension, actor).
 * One row per actor per month lets long-range distinct counts read months
 * instead of days. Idempotent.
 */
export async function internalEnsureMonthActorClaim(
	ctx: MutationCtx,
	target: {
		metric: string;
		occurredAtBucket: number;
		scopeType: typesDistinctActorRollupTarget["scope"]["scopeType"];
		scopeId: string;
		dimensionKey: string;
		dimensionValue: string;
		actorKey: string;
	},
) {
	const monthStart = startOfUtcMonth(target.occurredAtBucket);
	const claimKey = internalBuildMonthActorClaimKey({
		metric: target.metric,
		monthStart,
		scopeType: target.scopeType,
		scopeId: target.scopeId,
		dimensionKey: target.dimensionKey,
		dimensionValue: target.dimensionValue,
		actorKey: target.actorKey,
	});

	const existing = await ctx.db
		.query("analyticsDailyActorClaims")
		.withIndex("by_claim_key", (q) => q.eq("claimKey", claimKey))
		.first();

	if (existing) return;

	await ctx.db.insert("analyticsDailyActorClaims", {
		claimKey,
		metric: target.metric,
		bucketStart: monthStart,
		scopeType: target.scopeType,
		scopeId: target.scopeId,
		dimensionKey: target.dimensionKey,
		dimensionValue: target.dimensionValue,
		actorKey: target.actorKey,
		granularity: "month",
	});
}

export async function internalClaimDailyActorRollup(
	ctx: MutationCtx,
	target: typesDistinctActorRollupTarget,
) {
	const claimKey = internalBuildDailyActorClaimKey(target);
	const existing = await ctx.db
		.query("analyticsDailyActorClaims")
		.withIndex("by_claim_key", (q) => q.eq("claimKey", claimKey))
		.first();

	if (existing) {
		return { claimed: false };
	}

	await ctx.db.insert("analyticsDailyActorClaims", {
		claimKey,
		metric: target.metric,
		bucketStart: target.bucketStart,
		scopeType: target.scope.scopeType,
		scopeId: target.scope.scopeId,
		dimensionKey: target.dimensionKey,
		dimensionValue: target.dimensionValue,
		actorKey: target.actorKey,
	});

	await internalEnsureMonthActorClaim(ctx, {
		metric: target.metric,
		occurredAtBucket: target.bucketStart,
		scopeType: target.scope.scopeType,
		scopeId: target.scope.scopeId,
		dimensionKey: target.dimensionKey,
		dimensionValue: target.dimensionValue,
		actorKey: target.actorKey,
	});

	await internalIncrementDailyMetric(ctx, {
		metric: target.metric,
		granularity: "day",
		bucketStart: target.bucketStart,
		scope: target.scope,
		dimensionKey: target.dimensionKey,
		dimensionValue: target.dimensionValue,
		shard: 0,
		aggregation: "distinctActors",
		delta: 1,
	});

	return { claimed: true };
}
