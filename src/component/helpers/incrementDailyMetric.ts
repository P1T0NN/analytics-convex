// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type { typesAnalyticsMetricScope } from "../types/types.js";

export async function incrementDailyMetric(
	ctx: MutationCtx,
	args: {
		metric: string;
		bucketStart: number;
		scope: typesAnalyticsMetricScope;
		dimensionKey: string;
		dimensionValue: string;
		shard: number;
		delta: number;
		now: number;
	},
) {
	const existing = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_value_bucket_shard", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scope.scopeType)
				.eq("scopeId", args.scope.scopeId)
				.eq("granularity", "day")
				.eq("dimensionKey", args.dimensionKey)
				.eq("dimensionValue", args.dimensionValue)
				.eq("bucketStart", args.bucketStart)
				.eq("shard", args.shard),
		)
		.first();

	if (existing) {
		await ctx.db.patch("analyticsDailyMetrics", existing._id, {
			value: existing.value + args.delta,
			updatedAt: args.now,
		});
		return;
	}

	await ctx.db.insert("analyticsDailyMetrics", {
		metric: args.metric,
		granularity: "day",
		bucketStart: args.bucketStart,
		scopeType: args.scope.scopeType,
		scopeId: args.scope.scopeId,
		dimensionKey: args.dimensionKey,
		dimensionValue: args.dimensionValue,
		shard: args.shard,
		value: args.delta,
		updatedAt: args.now,
	});
}
