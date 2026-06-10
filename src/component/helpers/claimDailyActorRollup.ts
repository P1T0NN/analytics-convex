// HELPERS
import { internalIncrementDailyMetric } from "./incrementDailyMetric";

// UTILS
import { internalBuildDailyActorClaimKey } from "../utils/buildDailyActorClaimKey";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type { typesDistinctActorRollupTarget } from "../utils/getDistinctActorRollupTargets";

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
