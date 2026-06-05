// HELPERS
import { incrementDailyMetric } from "./incrementDailyMetric";

// UTILS
import { getMetricRollupIncrements } from "../utils/getMetricRollupIncrements";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesAnalyticsMetricConfig,
	typesAnalyticsMetricScope,
} from "../types/types.js";

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
