// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../../shared/utils/analyticsDefaultsUtils";

// UTILS
import { internalSerializeEvents } from "./serializeEvents";
import { internalSerializeMetrics } from "./serializeMetrics";
import { internalSerializeFunnels } from "./serializeFunnels";
import { internalCreateConfigurationHash } from "../../shared/utils/configurationHashUtils";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsRuntimeConfig,
} from "../../shared/types/index.js";

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
): typesAnalyticsRuntimeConfig {
	const serializedEvents = internalSerializeEvents(events);
	const serializedMetrics = internalSerializeMetrics(metrics);
	const serializedFunnels = internalSerializeFunnels(funnels);
	const resolvedSettings = {
		...internalDefaultAnalyticsSettings(),
		...(settings ?? {}),
	};

	const configHash = internalCreateConfigurationHash({
		events: serializedEvents,
		metrics: serializedMetrics,
		funnels: serializedFunnels ?? {},
		settings: resolvedSettings,
	});

	return {
		events: serializedEvents,
		metrics: serializedMetrics,
		...(serializedFunnels ? { funnels: serializedFunnels } : {}),
		settings: resolvedSettings,
		configHash,
	};
}
