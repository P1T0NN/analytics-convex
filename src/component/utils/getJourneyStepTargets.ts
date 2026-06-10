// UTILS
import {
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalGetScopesForEvent } from "./shared/scopeUtils";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";

export type typesJourneyStepTarget = {
	journey: string;
	stepIndex: number;
	bucketStart: number;
	scope: typesAnalyticsMetricScope;
	actorKey: string;
	properties: Record<string, string | number | boolean | null>;
	breakdownProperty?: string;
};

export function internalGetJourneyStepTargets(
	config: typesAnalyticsConfigState,
	event: typesAnalyticsAggregateEventInput,
): typesJourneyStepTarget[] {
	const actorKey = event.actorId;
	if (!actorKey) return [];

	const bucketStart = startOfUtcDay(event.occurredAt);
	const scopes = internalGetScopesForEvent(event);
	const targets: typesJourneyStepTarget[] = [];

	for (const [journeyName, journey] of config.journeyByName.entries()) {
		const stepIndex = journey.steps.indexOf(event.name);
		if (stepIndex === -1) continue;

		for (const scope of scopes) {
			targets.push({
				journey: journeyName,
				stepIndex,
				bucketStart,
				scope,
				actorKey,
				properties: event.properties ?? {},
				...(journey.breakdownProperty
					? { breakdownProperty: journey.breakdownProperty }
					: {}),
			});
		}
	}

	return targets;
}
