// HELPERS
import { internalIncrementDailyMetric } from "./incrementDailyMetric";

// UTILS
import { internalGetMetricRollupIncrements } from "../utils/getMetricRollupIncrements";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsMetricScope,
} from "../../shared/types/index.js";

export async function internalUpsertMetricRollupForEvent(
	ctx: MutationCtx,
	config: typesAnalyticsConfigState,
	event: typesAnalyticsAggregateEventInput,
	metric: typesAnalyticsMetricConfigRuntime,
	bucketStart?: number,
	scopes?: typesAnalyticsMetricScope[],
) {
	const increments = internalGetMetricRollupIncrements(
		config,
		event,
		metric,
		bucketStart,
		scopes,
	);

	await Promise.all(
		increments.map((increment) =>
			internalIncrementDailyMetric(ctx, increment),
		),
	);
}
