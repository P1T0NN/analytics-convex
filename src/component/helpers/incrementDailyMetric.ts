// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type {
	typesAnalyticsAggregation,
} from "../../shared/types/primitives.js";
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";

function internalNextRollupValue(
	aggregation: typesAnalyticsAggregation,
	existingValue: number,
	existingSampleCount: number | undefined,
	delta: number,
	sampleCountDelta: number | undefined,
) {
	switch (aggregation) {
		case "count":
		case "sum":
		case "distinctActors":
			return {
				value: existingValue + delta,
				sampleCount: existingSampleCount,
			};
		case "avg":
			return {
				value: existingValue + delta,
				sampleCount: (existingSampleCount ?? 0) + (sampleCountDelta ?? 1),
			};
		case "min":
			return {
				value: Math.min(existingValue, delta),
				sampleCount: existingSampleCount,
			};
		case "max":
			return {
				value: Math.max(existingValue, delta),
				sampleCount: existingSampleCount,
			};
	}
}

export async function internalIncrementDailyMetric(
	ctx: MutationCtx,
	args: typesMetricRollupIncrement,
) {
	const granularity = args.granularity ?? "day";
	const existing = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_value_bucket_shard", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scope.scopeType)
				.eq("scopeId", args.scope.scopeId)
				.eq("granularity", granularity)
				.eq("dimensionKey", args.dimensionKey)
				.eq("dimensionValue", args.dimensionValue)
				.eq("bucketStart", args.bucketStart)
				.eq("shard", args.shard),
		)
		.first();

	if (existing) {
		const next = internalNextRollupValue(
			args.aggregation,
			existing.value,
			existing.sampleCount,
			args.delta,
			args.sampleCountDelta,
		);

		await ctx.db.patch("analyticsDailyMetrics", existing._id, {
			value: next.value,
			...(next.sampleCount !== undefined
				? { sampleCount: next.sampleCount }
				: {}),
		});
		return;
	}

	await ctx.db.insert("analyticsDailyMetrics", {
		metric: args.metric,
		granularity,
		bucketStart: args.bucketStart,
		scopeType: args.scope.scopeType,
		scopeId: args.scope.scopeId,
		dimensionKey: args.dimensionKey,
		dimensionValue: args.dimensionValue,
		shard: args.shard,
		value: args.delta,
		...(args.aggregation === "avg"
			? { sampleCount: args.sampleCountDelta ?? 1 }
			: {}),
	});
}
