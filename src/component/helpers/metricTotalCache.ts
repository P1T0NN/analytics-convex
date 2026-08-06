// HELPERS
import { internalGetMetricTotalForRange } from "./rollupReads";
import {
	internalCreateReadBudget,
	type typesReadBudget,
} from "./readBudget";

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
	budget?: typesReadBudget,
) {
	const cache = new Map<string, number>();
	const unique = new Map<string, typesMetricTotalRequest>();
	const sharedBudget = budget ?? internalCreateReadBudget(config.settings);

	for (const request of requests) {
		const key = internalMetricTotalCacheKey(scope, request);
		if (!unique.has(key)) {
			unique.set(key, request);
		}
	}

	// Sequential on the shared budget: total rows read across every request in
	// this query stay under the per-query ceiling, no matter how many metrics
	// a dashboard asks for.
	for (const request of unique.values()) {
		const value = await internalGetMetricTotalForRange(ctx, config, {
			metric: request.metric,
			scope,
			from: request.from,
			to: request.to,
			budget: sharedBudget,
		});
		cache.set(internalMetricTotalCacheKey(scope, request), value);
	}

	return cache;
}

export function internalReadMetricTotalFromCache(
	cache: Map<string, number>,
	scope: typesAnalyticsScope,
	request: typesMetricTotalRequest,
) {
	return cache.get(internalMetricTotalCacheKey(scope, request)) ?? 0;
}
