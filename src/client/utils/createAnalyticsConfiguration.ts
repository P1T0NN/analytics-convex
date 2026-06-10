// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../../shared/utils/analyticsDefaultsUtils";

// UTILS
import { internalSerializeEvents } from "./serializeEvents";
import { internalSerializeMetrics } from "./serializeMetrics";
import { internalSerializeFunnels } from "./serializeFunnels";
import { internalSerializeJourneys } from "./serializeJourneys";
import { internalCreateConfigurationHash } from "../../shared/utils/configurationHashUtils";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsRuntimeConfig,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";

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
	journeys?: typesAnalyticsJourneysConfig,
): typesAnalyticsRuntimeConfig {
	const serializedEvents = internalSerializeEvents(events);
	const serializedMetrics = internalSerializeMetrics(metrics);
	const serializedFunnels = internalSerializeFunnels(funnels);
	const serializedJourneys = internalSerializeJourneys(journeys);
	const resolvedSettings = {
		...internalDefaultAnalyticsSettings(),
		...(settings ?? {}),
	};

	const configHash = internalCreateConfigurationHash({
		events: serializedEvents,
		metrics: serializedMetrics,
		funnels: serializedFunnels ?? {},
		journeys: serializedJourneys ?? {},
		settings: resolvedSettings,
	});

	return {
		events: serializedEvents,
		metrics: serializedMetrics,
		...(serializedFunnels ? { funnels: serializedFunnels } : {}),
		...(serializedJourneys ? { journeys: serializedJourneys } : {}),
		settings: resolvedSettings,
		configHash,
	};
}
