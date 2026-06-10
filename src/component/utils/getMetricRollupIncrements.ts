// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { internalGetMetricDelta, internalGetTrafficMode, internalGetMetricRollupGranularity, internalGetMetricBucketStart } from "./shared/metricUtils";
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
	typesAnalyticsRollupGranularity,
} from "../../shared/types/primitives.js";

function createMetricRollupIncrement(
	metric: typesAnalyticsMetricConfigRuntime,
	args: Omit<
		typesMetricRollupIncrement,
		"metric" | "aggregation" | "delta" | "sampleCountDelta" | "granularity"
	> & { delta: number },
): typesMetricRollupIncrement {
	return {
		metric: metric.name,
		aggregation: metric.aggregation,
		granularity: internalGetMetricRollupGranularity(metric),
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
	granularity: typesAnalyticsRollupGranularity;
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

	const bucket =
		bucketStart ?? internalGetMetricBucketStart(metric, event.occurredAt);
	const eventScopes = scopes ?? internalGetScopesForEvent(event);
	const trafficMode = internalGetTrafficMode(config.settings, metric);
	const shardCount = internalGetShardCount(config.settings, trafficMode);
	const increments: typesMetricRollupIncrement[] = [];

	for (const scope of eventScopes) {
		increments.push(
			createMetricRollupIncrement(metric, {
				bucketStart: bucket,
				scope,
				dimensionKey: TOTAL_DIMENSION,
				dimensionValue: TOTAL_DIMENSION,
				shard: internalGetMetricShard(event, {
					metric: metric.name,
					scope,
					dimensionKey: TOTAL_DIMENSION,
					dimensionValue: TOTAL_DIMENSION,
					shardCount,
				}),
				delta,
			}),
		);

		for (const dimensionKey of metric.dimensions ?? []) {
			const propertyValue = event.properties[dimensionKey];

			if (
				propertyValue === undefined ||
				propertyValue === null ||
				typeof propertyValue === "boolean"
			) {
				continue;
			}

			const dimensionValue = String(propertyValue);
			increments.push(
				createMetricRollupIncrement(metric, {
					bucketStart: bucket,
					scope,
					dimensionKey,
					dimensionValue,
					shard: internalGetMetricShard(event, {
						metric: metric.name,
						scope,
						dimensionKey,
						dimensionValue,
						shardCount,
					}),
					delta,
				}),
			);
		}
	}

	return increments;
}
