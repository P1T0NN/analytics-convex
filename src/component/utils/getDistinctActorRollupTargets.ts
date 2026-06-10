// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { internalGetScopesForEvent } from "./shared/scopeUtils";
import {
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalGetMetricActorKey } from "./shared/metricUtils";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricConfigRuntime,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";

export type typesDistinctActorRollupTarget = {
	metric: string;
	bucketStart: number;
	scope: typesAnalyticsMetricScope;
	dimensionKey: string;
	dimensionValue: string;
	actorKey: string;
};

export function internalGetDistinctActorRollupTargets(
	event: typesAnalyticsAggregateEventInput,
	metric: typesAnalyticsMetricConfigRuntime,
	bucketStart?: number,
	scopes?: typesAnalyticsMetricScope[],
): typesDistinctActorRollupTarget[] {
	const actorKey = internalGetMetricActorKey(metric, event);
	if (!actorKey) return [];

	const bucket = bucketStart ?? startOfUtcDay(event.occurredAt);
	const eventScopes = scopes ?? internalGetScopesForEvent(event);
	const targets: typesDistinctActorRollupTarget[] = [];

	for (const scope of eventScopes) {
		targets.push({
			metric: metric.name,
			bucketStart: bucket,
			scope,
			dimensionKey: TOTAL_DIMENSION,
			dimensionValue: TOTAL_DIMENSION,
			actorKey,
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

			targets.push({
				metric: metric.name,
				bucketStart: bucket,
				scope,
				dimensionKey,
				dimensionValue: String(propertyValue),
				actorKey,
			});
		}
	}

	return targets;
}
