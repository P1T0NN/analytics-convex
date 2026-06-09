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
	typesAnalyticsFunnelsConfig,
} from "../types/types";
import { serializeFunnels } from "./serializeFunnels";

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
	funnels?: typesAnalyticsFunnelsConfig,
) {
	const serializedFunnels = serializeFunnels(funnels);

	return {
		events: serializeEvents(events),
		metrics: serializeMetrics(metrics),
		...(serializedFunnels ? { funnels: serializedFunnels } : {}),
		settings: {
			...defaultAnalyticsSettings(),
			...(settings ?? {}),
		},
	};
}
