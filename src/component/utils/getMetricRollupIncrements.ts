// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { internalGetMetricDelta, internalGetTrafficMode, internalGetMetricRollupGranularity, internalGetMetricBucketStart } from "./shared/metricUtils";
import { startOfUtcMonth } from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalGetScopesForEvent } from "./shared/scopeUtils";
import { internalGetShardCount, internalGetMetricShard } from "./shared/shardUtils";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricConfigRuntime,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";
import type {
	typesAnalyticsRollupBucketGranularity,
} from "../../shared/types/primitives.js";

function createMetricRollupIncrement(
	metric: typesAnalyticsMetricConfigRuntime,
	args: Omit<
		typesMetricRollupIncrement,
		"metric" | "aggregation" | "delta" | "sampleCountDelta" | "granularity"
	> & { delta: number; granularity: typesAnalyticsRollupBucketGranularity },
): typesMetricRollupIncrement {
	return {
		metric: metric.name,
		aggregation: metric.aggregation,
		granularity: args.granularity,
		delta: args.delta,
		...(metric.aggregation === "avg" ? { sampleCountDelta: 1 } : {}),
		bucketStart: args.bucketStart,
		scope: args.scope,
		dimensionKey: args.dimensionKey,
		dimensionValue: args.dimensionValue,
		shard: args.shard,
	};
}

export type typesMetricRollupIncrement = {
	metric: string;
	granularity: typesAnalyticsRollupBucketGranularity;
	bucketStart: number;
	scope: typesAnalyticsMetricScope;
	dimensionKey: string;
	dimensionValue: string;
	shard: number;
	aggregation: typesAnalyticsMetricConfigRuntime["aggregation"];
	delta: number;
	sampleCountDelta?: number;
};

export function internalGetMetricRollupIncrements(
	config: typesAnalyticsConfigState,
	event: typesAnalyticsAggregateEventInput,
	metric: typesAnalyticsMetricConfigRuntime,
	bucketStart?: number,
	scopes?: typesAnalyticsMetricScope[],
): typesMetricRollupIncrement[] {
	const delta = internalGetMetricDelta(metric, event.properties);
	if (delta === null) return [];

	const granularity = internalGetMetricRollupGranularity(metric);
	const bucket =
		bucketStart ?? internalGetMetricBucketStart(metric, event.occurredAt);
	// Day metrics also land in a month bucket so long-range reads can hit
	// ~12 month rows instead of one row per day. Valid for every aggregation
	// that reaches this function: count/sum add, avg carries sampleCount,
	// min/max merge. distinctActors never gets here (delta is null above).
	const monthBucket =
		granularity === "day" ? startOfUtcMonth(event.occurredAt) : null;
	const eventScopes = scopes ?? internalGetScopesForEvent(event);
	const trafficMode = internalGetTrafficMode(config.settings, metric);
	const shardCount = internalGetShardCount(config.settings, trafficMode);
	const increments: typesMetricRollupIncrement[] = [];

	const pushIncrements = (dimensionKey: string, dimensionValue: string, scope: typesAnalyticsMetricScope) => {
		const shard = internalGetMetricShard(event, {
			metric: metric.name,
			scope,
			dimensionKey,
			dimensionValue,
			shardCount,
		});

		increments.push(
			createMetricRollupIncrement(metric, {
				granularity,
				bucketStart: bucket,
				scope,
				dimensionKey,
				dimensionValue,
				shard,
				delta,
			}),
		);

		if (monthBucket !== null) {
			increments.push(
				createMetricRollupIncrement(metric, {
					granularity: "month",
					bucketStart: monthBucket,
					scope,
					dimensionKey,
					dimensionValue,
					shard,
					delta,
				}),
			);
		}
	};

	for (const scope of eventScopes) {
		pushIncrements(TOTAL_DIMENSION, TOTAL_DIMENSION, scope);

		for (const dimensionKey of metric.dimensions ?? []) {
			const propertyValue = event.properties[dimensionKey];

			if (
				propertyValue === undefined ||
				propertyValue === null ||
				typeof propertyValue === "boolean"
			) {
				continue;
			}

			pushIncrements(dimensionKey, String(propertyValue), scope);
		}
	}

	return increments;
}
