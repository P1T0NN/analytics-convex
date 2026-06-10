// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// HELPERS
import {
	internalCollectDailyMetricRows,
	internalGetMetricTotalForRange,
	internalSumDailyMetricRowsForRange,
} from "./rollupReads";

// UTILS
import { internalGetMetricRollupGranularity } from "../utils/shared/metricUtils";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsScope,
} from "../../shared/types/scopes.js";

export type typesMetricTotalRequest = {
	metric: string;
	from: number;
	to: number;
};

export function internalMetricTotalCacheKey(
	scope: typesAnalyticsScope,
	request: typesMetricTotalRequest,
) {
	return `${request.metric}:${request.from}:${request.to}:${scope.type}:${scope.id}`;
}

export async function internalFetchMetricTotalsBatch(
	ctx: QueryCtx,
	config: typesAnalyticsConfigState,
	scope: typesAnalyticsScope,
	requests: typesMetricTotalRequest[],
) {
	const cache = new Map<string, number>();
	const unique = new Map<string, typesMetricTotalRequest>();

	for (const request of requests) {
		const key = internalMetricTotalCacheKey(scope, request);
		if (!unique.has(key)) {
			unique.set(key, request);
		}
	}

	const byMetric = new Map<string, typesMetricTotalRequest[]>();
	for (const request of unique.values()) {
		const metricRequests = byMetric.get(request.metric) ?? [];
		metricRequests.push(request);
		byMetric.set(request.metric, metricRequests);
	}

	await Promise.all(
		[...byMetric.entries()].map(async ([metric, metricRequests]) => {
			const metricConfig = config.metricByName.get(metric);
			const aggregation = metricConfig?.aggregation ?? "sum";

			// Distinct actors cannot be summed across day buckets — an actor
			// active on several days would be counted once per day. Delegate to
			// the claims-aware total helper per requested range instead.
			if (aggregation === "distinctActors") {
				await Promise.all(
					metricRequests.map(async (request) => {
						const value = await internalGetMetricTotalForRange(ctx, config, {
							metric,
							scope,
							from: request.from,
							to: request.to,
						});
						cache.set(internalMetricTotalCacheKey(scope, request), value);
					}),
				);
				return;
			}

			const granularity = metricConfig
				? internalGetMetricRollupGranularity(metricConfig)
				: "day";
			const minFrom = Math.min(...metricRequests.map((request) => request.from));
			const maxTo = Math.max(...metricRequests.map((request) => request.to));
			const rows = await internalCollectDailyMetricRows(ctx, {
				metric,
				scope,
				dimensionKey: TOTAL_DIMENSION,
				from: minFrom,
				to: maxTo,
				settings: config.settings,
				granularity,
			});

			for (const request of metricRequests) {
				cache.set(
					internalMetricTotalCacheKey(scope, request),
					internalSumDailyMetricRowsForRange(
						rows,
						request.from,
						request.to,
						aggregation,
						granularity,
					),
				);
			}
		}),
	);

	return cache;
}

export function internalReadMetricTotalFromCache(
	cache: Map<string, number>,
	scope: typesAnalyticsScope,
	request: typesMetricTotalRequest,
) {
	return cache.get(internalMetricTotalCacheKey(scope, request)) ?? 0;
}
