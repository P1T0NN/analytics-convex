// HELPERS
import { getMetricTotalForRange } from "./rollupReads";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
	typesAnalyticsScope,
} from "../types/types";

export type typesMetricTotalRequest = {
	metric: string;
	from: number;
	to: number;
};

export function metricTotalCacheKey(
	scope: typesAnalyticsScope,
	request: typesMetricTotalRequest,
) {
	return `${request.metric}:${request.from}:${request.to}:${scope.type}:${scope.id}`;
}

export async function fetchMetricTotalsBatch(
	ctx: QueryCtx,
	config: typesAnalyticsConfigState,
	scope: typesAnalyticsScope,
	requests: typesMetricTotalRequest[],
) {
	const cache = new Map<string, number>();
	const unique = new Map<string, typesMetricTotalRequest>();

	for (const request of requests) {
		const key = metricTotalCacheKey(scope, request);
		if (!unique.has(key)) {
			unique.set(key, request);
		}
	}

	await Promise.all(
		[...unique.values()].map(async (request) => {
			const key = metricTotalCacheKey(scope, request);
			const value = await getMetricTotalForRange(ctx, config, {
				metric: request.metric,
				scope,
				from: request.from,
				to: request.to,
			});
			cache.set(key, value);
		}),
	);

	return cache;
}

export function readMetricTotalFromCache(
	cache: Map<string, number>,
	scope: typesAnalyticsScope,
	request: typesMetricTotalRequest,
) {
	return cache.get(metricTotalCacheKey(scope, request)) ?? 0;
}
