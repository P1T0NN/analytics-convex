// UTILS
import { internalBadRequest } from "../../errors/errors";
import {
	startOfUtcDay,
	startOfUtcHour,
} from "../../../shared/utils/analyticsDateRangeUtils.js";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
} from "../../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricConfigRuntime,
} from "../../../shared/types/config.js";
import type {
	typesAnalyticsProperties,
	typesRollupMode,
} from "../../../shared/types/primitives.js";
import type {
	typesAnalyticsSettings,
} from "../../../shared/types/settings.js";

export function internalGetMetricDelta(
	metric: typesAnalyticsMetricConfigRuntime,
	properties: typesAnalyticsProperties,
) {
	if (metric.aggregation === "count") return 1;
	if (metric.aggregation === "distinctActors") return null;

	const value = metric.valueProperty
		? properties[metric.valueProperty]
		: undefined;

	return typeof value === "number" ? value : null;
}

export function internalGetMetricActorKey(
	metric: typesAnalyticsMetricConfigRuntime,
	event: typesAnalyticsAggregateEventInput,
) {
	if (metric.aggregation !== "distinctActors") return null;

	if (metric.actorProperty) {
		const value = event.properties[metric.actorProperty];
		if (value === undefined || value === null || typeof value === "boolean") {
			return null;
		}

		return String(value);
	}

	return event.actorId ?? null;
}

export function internalIsDistinctActorsMetric(
	metric: typesAnalyticsMetricConfigRuntime,
) {
	return metric.aggregation === "distinctActors";
}

export function internalGetTrafficMode(
	settings: typesAnalyticsSettings,
	metric: typesAnalyticsMetricConfigRuntime,
) {
	return metric.trafficMode ?? settings.trafficMode;
}

export function internalIsHighVolumeMetric(
	settings: typesAnalyticsSettings,
	metric: typesAnalyticsMetricConfigRuntime,
) {
	return internalGetTrafficMode(settings, metric) === "highVolume";
}

export function internalGetHighVolumeEventNames(config: typesAnalyticsConfigState) {
	const eventNames = new Set<string>();

	for (const metric of config.metrics) {
		if (!internalIsHighVolumeMetric(config.settings, metric)) continue;

		for (const eventName of metric.eventNames) {
			eventNames.add(eventName);
		}
	}

	return eventNames;
}

export function internalShouldAggregateMetric(
	config: typesAnalyticsConfigState,
	event: typesAnalyticsAggregateEventInput,
	metric: typesAnalyticsMetricConfigRuntime,
	mode: typesRollupMode,
) {
	if (!metric.eventNames.includes(event.name)) return false;

	if (mode === "realtime" && internalIsHighVolumeMetric(config.settings, metric))
		return false;

	if (mode === "highVolume" && !internalIsHighVolumeMetric(config.settings, metric))
		return false;

	return true;
}

export function internalGetMetricConfigOrThrow(
	config: typesAnalyticsConfigState,
	metric: string,
): typesAnalyticsMetricConfigRuntime {
	const metricConfig = config.metricByName.get(metric);
	if (!metricConfig) internalBadRequest(`Unknown analytics metric "${metric}".`);

	return metricConfig;
}

export function internalGetMetricRollupGranularity(
	metric: typesAnalyticsMetricConfigRuntime,
) {
	return metric.rollupGranularity ?? "day";
}

export function internalGetMetricBucketStart(
	metric: typesAnalyticsMetricConfigRuntime,
	occurredAt: number,
) {
	return internalGetMetricRollupGranularity(metric) === "hour"
		? startOfUtcHour(occurredAt)
		: startOfUtcDay(occurredAt);
}
