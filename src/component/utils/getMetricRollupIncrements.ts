// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { internalGetMetricDelta, internalGetTrafficMode } from "./shared/metricUtils";
import { internalGetScopesForEvent } from "./shared/scopeUtils";
import { internalGetShardCount, internalGetMetricShard } from "./shared/shardUtils";
import { internalStartOfUtcDay } from "./common/dateUtils";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsMetricScope,
} from "../../shared/types/index.js";

export type typesMetricRollupIncrement = {
	metric: string;
	bucketStart: number;
	scope: typesAnalyticsMetricScope;
	dimensionKey: string;
	dimensionValue: string;
	shard: number;
	delta: number;
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

	const bucket = bucketStart ?? internalStartOfUtcDay(event.occurredAt);
	const eventScopes = scopes ?? internalGetScopesForEvent(event);
	const trafficMode = internalGetTrafficMode(config.settings, metric);
	const shardCount = internalGetShardCount(config.settings, trafficMode);
	const increments: typesMetricRollupIncrement[] = [];

	for (const scope of eventScopes) {
		increments.push({
			metric: metric.name,
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
		});

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
			increments.push({
				metric: metric.name,
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
			});
		}
	}

	return increments;
}
