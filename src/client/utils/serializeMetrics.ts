// TYPES
import type { typesAnalyticsMetricConfig } from "../types/types";

export function serializeMetrics(
	metrics: readonly typesAnalyticsMetricConfig[],
) {
	return metrics.map((metric) => ({
		name: metric.name,
		label: metric.label,
		...(metric.description ? { description: metric.description } : {}),
		unit: metric.unit,
		eventNames: [...metric.eventNames],
		aggregation: metric.aggregation,
		...(metric.valueProperty ? { valueProperty: metric.valueProperty } : {}),
		...(metric.dimensions ? { dimensions: [...metric.dimensions] } : {}),
		...(metric.trafficMode ? { trafficMode: metric.trafficMode } : {}),
		...(metric.adminOnly === undefined ? {} : { adminOnly: metric.adminOnly }),
		...(metric.evaluation ? { evaluation: metric.evaluation } : {}),
	}));
}
