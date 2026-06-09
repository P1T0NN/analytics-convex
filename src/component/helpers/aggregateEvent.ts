// HELPERS
import { internalIncrementDailyMetric } from "./incrementDailyMetric";
import { internalUpsertMetricRollupForEvent } from "./upsertMetricRollupForEvent";

// UTILS
import { internalStartOfUtcDay } from "../utils/common/dateUtils";
import { internalShouldAggregateMetric } from "../utils/shared/metricUtils";
import { internalGetScopesForEvent } from "../utils/shared/scopeUtils";
import { internalGetRollupIncrementKey } from "../utils/getRollupIncrementKey";
import { internalGetMetricRollupIncrements } from "../utils/getMetricRollupIncrements";

// TYPES
import type { MutationCtx } from "../_generated/server";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesRollupMode,
} from "../../shared/types/index.js";
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";

export async function internalAggregateEvent(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	eventOrEvents:
		| typesAnalyticsAggregateEventInput
		| typesAnalyticsAggregateEventInput[],
	mode: typesRollupMode,
) {
	if (!Array.isArray(eventOrEvents)) {
		const event = eventOrEvents;
		const bucketStart = internalStartOfUtcDay(event.occurredAt);
		const scopes = internalGetScopesForEvent(event);

		await Promise.all(
			config.metrics
				.filter((metric) =>
					internalShouldAggregateMetric(config, event, metric, mode),
				)
				.map((metric) =>
					internalUpsertMetricRollupForEvent(
						ctx,
						config,
						event,
						metric,
						bucketStart,
						scopes,
					),
				),
		);

		return;
	}

	const events = eventOrEvents;
	const incrementsByKey = new Map<string, typesMetricRollupIncrement>();

	for (const event of events) {
		const bucketStart = internalStartOfUtcDay(event.occurredAt);
		const scopes = internalGetScopesForEvent(event);

		for (const metric of config.metrics) {
			if (!internalShouldAggregateMetric(config, event, metric, mode)) continue;

			for (const increment of internalGetMetricRollupIncrements(
				config,
				event,
				metric,
				bucketStart,
				scopes,
			)) {
				const key = internalGetRollupIncrementKey(increment);
				const existing = incrementsByKey.get(key);

				if (existing) {
					existing.delta += increment.delta;
					continue;
				}

				incrementsByKey.set(key, { ...increment });
			}
		}
	}

	await Promise.all(
		[...incrementsByKey.values()].map((increment) =>
			internalIncrementDailyMetric(ctx, increment),
		),
	);
}
