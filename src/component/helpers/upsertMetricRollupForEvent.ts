// CONSTANTS
import { TOTAL_DIMENSION } from "../constants";

// HELPERS
import { incrementDailyMetric } from "./incrementDailyMetric";

// UTILS
import { getMetricDelta, getTrafficMode } from "../utils/shared/metricUtils";
import { getScopesForEvent } from "../utils/shared/scopeUtils";
import { getShardCount, getMetricShard } from "../utils/shared/shardUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type {
    typesAnalyticsAggregateEventInput,
    typesAnalyticsConfigState,
    typesAnalyticsMetricConfig,
    typesAnalyticsMetricScope,
} from "../types/types.js";

export type typesMetricRollupIncrement = {
    metric: string;
    bucketStart: number;
    scope: typesAnalyticsMetricScope;
    dimensionKey: string;
    dimensionValue: string;
    shard: number;
    delta: number;
};

export function getMetricRollupIncrements(
    config: typesAnalyticsConfigState,
    event: typesAnalyticsAggregateEventInput,
    metric: typesAnalyticsMetricConfig,
    bucketStart?: number,
    scopes?: typesAnalyticsMetricScope[],
): typesMetricRollupIncrement[] {
    const delta = getMetricDelta(metric, event.properties);
    if (delta === null) return [];
    
    const bucket = bucketStart ?? startOfUtcDay(event.occurredAt);
    const eventScopes = scopes ?? getScopesForEvent(event);
    const trafficMode = getTrafficMode(config.settings, metric);
    const shardCount = getShardCount(config.settings, trafficMode);
    const increments: typesMetricRollupIncrement[] = [];
    
    for (const scope of eventScopes) {
        increments.push({
            metric: metric.name,
            bucketStart: bucket,
            scope,
            dimensionKey: TOTAL_DIMENSION,
            dimensionValue: TOTAL_DIMENSION,
            shard: getMetricShard(event, {
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
                shard: getMetricShard(event, {
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

export async function upsertMetricRollupForEvent(
    ctx: MutationCtx,
    config: typesAnalyticsConfigState,
    event: typesAnalyticsAggregateEventInput,
    metric: typesAnalyticsMetricConfig,
    bucketStart?: number,
    scopes?: typesAnalyticsMetricScope[],
    now?: number,
) {
    const timestamp = now ?? Date.now();
    
    for (const increment of getMetricRollupIncrements(
        config,
        event,
        metric,
        bucketStart,
        scopes,
    )) {
        await incrementDailyMetric(ctx, {
            ...increment,
            now: timestamp,
        });
    }
}
