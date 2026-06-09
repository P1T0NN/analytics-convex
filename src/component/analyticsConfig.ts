// UTILS
import { internalHumanizeKey } from "./utils/common/stringUtils.js";
import { internalCreateConfigurationHash } from "./utils/configurationHash.js";

// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../shared/utils/analyticsDefaultsUtils.js";

// TYPES
import type {
	typesAnalyticsSettings,
	typesAnalyticsConfigState,
	typesAnalyticsPropertyType,
	typesAnalyticsRuntimeConfig,
} from "../shared/types/index.js";

export function internalDefaultSettings(): typesAnalyticsSettings {
	return internalDefaultAnalyticsSettings();
}

export function internalChartConfig(
	seriesKeys: string[],
	labels?: Record<string, string>,
) {
	return Object.fromEntries(
		seriesKeys.map((key) => [
			key,
			{
				label: labels?.[key] ?? internalHumanizeKey(key),
			},
		]),
	);
}

export function internalNormalizeConfig(
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
		...internalDefaultSettings(),
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
			internalCreateConfigurationHash({
				events,
				metrics,
				funnels,
				settings,
			}),
	};
}
