// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../../shared/utils/analyticsDefaultsUtils";

// UTILS
import { internalSerializeEvents } from "./serializeEvents";
import { internalSerializeMetrics } from "./serializeMetrics";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
} from "../../shared/types/index.js";
import { internalSerializeFunnels } from "./serializeFunnels";

export function internalCreateAnalyticsConfiguration<
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
	const serializedFunnels = internalSerializeFunnels(funnels);

	return {
		events: internalSerializeEvents(events),
		metrics: internalSerializeMetrics(metrics),
		...(serializedFunnels ? { funnels: serializedFunnels } : {}),
		settings: {
			...internalDefaultAnalyticsSettings(),
			...(settings ?? {}),
		},
	};
}
