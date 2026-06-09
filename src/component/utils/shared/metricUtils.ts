// UTILS
import { internalBadRequest } from "../../errors/errors";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsConfigState,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsProperties,
	typesAnalyticsSettings,
	typesRollupMode,
} from "../../../shared/types/index.js";

export function internalGetMetricDelta(
	metric: typesAnalyticsMetricConfigRuntime,
	properties: typesAnalyticsProperties,
) {
	if (metric.aggregation === "count") return 1;

	const value = metric.valueProperty
		? properties[metric.valueProperty]
		: undefined;

	return typeof value === "number" ? value : null;
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

export function internalHasHighVolumeMetrics(
	config: typesAnalyticsConfigState,
	eventName: string,
) {
	return config.metrics.some((metric) => {
		return (
			metric.eventNames.includes(eventName) &&
			internalIsHighVolumeMetric(config.settings, metric)
		);
	});
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
