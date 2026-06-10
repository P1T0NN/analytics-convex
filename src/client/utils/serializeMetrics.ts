// TYPES
import type {
	typesAnalyticsMetricConfig,
} from "../../shared/types/config.js";

export function internalSerializeMetrics(
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
		...(metric.actorProperty ? { actorProperty: metric.actorProperty } : {}),
		...(metric.dimensions ? { dimensions: [...metric.dimensions] } : {}),
		...(metric.trafficMode ? { trafficMode: metric.trafficMode } : {}),
		...(metric.rollupGranularity
			? { rollupGranularity: metric.rollupGranularity }
			: {}),
		...(metric.adminOnly === undefined ? {} : { adminOnly: metric.adminOnly }),
		...(metric.evaluation ? { evaluation: metric.evaluation } : {}),
	}));
}
