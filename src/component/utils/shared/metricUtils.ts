// TYPES
import type {
    typesAnalyticsConfigState,
    typesAnalyticsMetricConfig,
    typesAnalyticsProperties,
    typesAnalyticsSettings,
} from "../../types/types";

export function getMetricDelta(
    metric: typesAnalyticsMetricConfig,
    properties: typesAnalyticsProperties,
) {
    if (metric.aggregation === "count") return 1;
    
    const value = metric.valueProperty
        ? properties[metric.valueProperty]
        : undefined;
    
    return typeof value === "number" ? value : null;
}

export function getTrafficMode(
    settings: typesAnalyticsSettings,
    metric: typesAnalyticsMetricConfig,
) {
    return metric.trafficMode ?? settings.trafficMode;
}

export function isHighVolumeMetric(
    settings: typesAnalyticsSettings,
    metric: typesAnalyticsMetricConfig,
) {
    return getTrafficMode(settings, metric) === "highVolume";
}

export function hasHighVolumeMetrics(
    config: typesAnalyticsConfigState,
    eventName: string,
) {
    return config.metrics.some((metric) => {
        return (
            metric.eventNames.includes(eventName) && isHighVolumeMetric(config.settings, metric)
        );
    });
}

export function getHighVolumeEventNames(config: typesAnalyticsConfigState) {
    const eventNames = new Set<string>();

    for (const metric of config.metrics) {
        if (!isHighVolumeMetric(config.settings, metric)) continue;

        for (const eventName of metric.eventNames) {
            eventNames.add(eventName);
        }
    }

    return eventNames;
}
