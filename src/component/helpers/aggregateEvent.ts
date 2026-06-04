// HELPERS
import { incrementDailyMetric } from "./incrementDailyMetric";
import {
    getMetricRollupIncrements,
    upsertMetricRollupForEvent,
} from "./upsertMetricRollupForEvent";

// UTILS
import { startOfUtcDay } from "../utils/common/dateUtils";
import { isHighVolumeMetric } from "../utils/shared/metricUtils";
import { getScopesForEvent } from "../utils/shared/scopeUtils";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
    typesAnalyticsAggregateEventInput,
    typesAnalyticsConfigState,
    typesAnalyticsMetricConfig,
    typesRollupMode,
} from "../types/types.js";
import type { typesMetricRollupIncrement } from "./upsertMetricRollupForEvent";

function shouldAggregateMetric(
    config: typesAnalyticsConfigState,
    event: typesAnalyticsAggregateEventInput,
    metric: typesAnalyticsMetricConfig,
    mode: typesRollupMode,
) {
    if (!metric.eventNames.includes(event.name)) return false;
    
    if (mode === "realtime" && isHighVolumeMetric(config.settings, metric))
        return false;
    
    if (mode === "highVolume" && !isHighVolumeMetric(config.settings, metric))
        return false;
    
    return true;
}

function getRollupIncrementKey(increment: typesMetricRollupIncrement) {
    return JSON.stringify([
        increment.metric,
        increment.bucketStart,
        increment.scope.scopeType,
        increment.scope.scopeId,
        increment.dimensionKey,
        increment.dimensionValue,
        increment.shard,
    ]);
}

export async function aggregateEvent(
    ctx: MutationCtx,
    config: typesAnalyticsConfigState,
    event: typesAnalyticsAggregateEventInput,
    mode: typesRollupMode,
) {
    const bucketStart = startOfUtcDay(event.occurredAt);
    const now = Date.now();
    const scopes = getScopesForEvent(event);
    
    for (const metric of config.metrics) {
        if (!shouldAggregateMetric(config, event, metric, mode)) continue;
    
        await upsertMetricRollupForEvent(
            ctx,
            config,
            event,
            metric,
            bucketStart,
            scopes,
            now,
        );
    }
}

export async function aggregateEvents(
    ctx: MutationCtx,
    config: typesAnalyticsConfigState,
    events: typesAnalyticsAggregateEventInput[],
    mode: typesRollupMode,
) {
    const now = Date.now();
    const incrementsByKey = new Map<string, typesMetricRollupIncrement>();
    
    for (const event of events) {
        const bucketStart = startOfUtcDay(event.occurredAt);
        const scopes = getScopesForEvent(event);
    
        for (const metric of config.metrics) {
            if (!shouldAggregateMetric(config, event, metric, mode)) continue;
    
            for (const increment of getMetricRollupIncrements(
                config,
                event,
                metric,
                bucketStart,
                scopes,
            )) {
                const key = getRollupIncrementKey(increment);
                const existing = incrementsByKey.get(key);
    
                if (existing) {
                    existing.delta += increment.delta;
                    continue;
                }
    
                incrementsByKey.set(key, { ...increment });
            }
        }
    }
    
    for (const increment of incrementsByKey.values()) {
        await incrementDailyMetric(ctx, {
            ...increment,
            now,
        });
    }
}
