// DEFAULTS
import { defaultAnalyticsSettings } from "../../shared/analyticsDefaults";

// UTILS
import { serializeEvents } from "./serializeEvents";
import { serializeMetrics } from "./serializeMetrics";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
} from "../types/types";

export function createAnalyticsConfiguration<
	const Events extends readonly typesAnalyticsEventConfig[],
	const Metrics extends readonly typesAnalyticsMetricConfig<
		string,
		Events[number]["name"]
	>[],
>(
	events: Events,
	metrics: Metrics,
	settings?: Partial<typesAnalyticsSettings>,
) {
	return {
		events: serializeEvents(events),
		metrics: serializeMetrics(metrics),
		settings: {
			...defaultAnalyticsSettings(),
			...(settings ?? {}),
		},
	};
}
