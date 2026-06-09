// UTILS
import { humanizeKey } from "./utils/common/stringUtils.js";
import { createConfigurationHash } from "./utils/configurationHash.js";

// DEFAULTS
import { defaultAnalyticsSettings } from "../shared/analyticsDefaults.js";

// TYPES
import type {
	typesAnalyticsSettings,
	typesAnalyticsConfigState,
	typesAnalyticsPropertyType,
	typesAnalyticsRuntimeConfig,
} from "./types/types.js";

export function defaultSettings(): typesAnalyticsSettings {
	return defaultAnalyticsSettings();
}

export function chartConfig(
	seriesKeys: string[],
	labels?: Record<string, string>,
) {
	return Object.fromEntries(
		seriesKeys.map((key) => [
			key,
			{
				label: labels?.[key] ?? humanizeKey(key),
			},
		]),
	);
}

export function normalizeConfig(
	config: typesAnalyticsRuntimeConfig,
): typesAnalyticsConfigState {
	const events = config.events.map((event) => ({
		...event,
		properties: event.properties as
			| Record<string, typesAnalyticsPropertyType>
			| undefined,
	}));
	const metrics = config.metrics.map((metric) => ({ ...metric }));
	const funnels = config.funnels ?? {};
	const settings = {
		...defaultSettings(),
		...config.settings,
	};

	return {
		events,
		metrics,
		funnels,
		eventByName: new Map(events.map((event) => [event.name, event])),
		metricByName: new Map(metrics.map((metric) => [metric.name, metric])),
		funnelByName: new Map(
			Object.entries(funnels).map(([name, funnel]) => [name, funnel]),
		),
		settings,
		configHash:
			config.configHash ??
			createConfigurationHash({
				events,
				metrics,
				funnels,
				settings,
			}),
	};
}
