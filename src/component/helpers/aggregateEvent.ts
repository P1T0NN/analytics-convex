// HELPERS
import { incrementDailyMetric } from "./incrementDailyMetric";
import { upsertMetricRollupForEvent } from "./upsertMetricRollupForEvent";

// UTILS
import { startOfUtcDay } from "../utils/common/dateUtils";
import { shouldAggregateMetric } from "../utils/shared/metricUtils";
import { getScopesForEvent } from "../utils/shared/scopeUtils";
import { getRollupIncrementKey } from "../utils/getRollupIncrementKey";
import { getMetricRollupIncrements } from "../utils/getMetricRollupIncrements";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesRollupMode,
} from "../types/types.js";
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";

export async function aggregateEvent(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	eventOrEvents:
		| typesAnalyticsAggregateEventInput
		| typesAnalyticsAggregateEventInput[],
	mode: typesRollupMode,
) {
	// Single event — upsert each matching metric directly
	if (!Array.isArray(eventOrEvents)) {
		const event = eventOrEvents;
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

		return;
	}

	// Batch — collect and merge increments, then write once per key
	const events = eventOrEvents;
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
