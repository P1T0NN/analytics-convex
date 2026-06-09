// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../shared/utils/analyticsDefaultsUtils.js";

// UTILS
import { internalHumanizeKey } from "./utils/common/stringUtils.js";
import { internalCreateConfigurationHash } from "../shared/utils/configurationHashUtils.js";

// TYPES
import type {
	typesAnalyticsSettings,
	typesAnalyticsPropertyType,
	typesAnalyticsConfigState,
	typesAnalyticsRuntimeConfig,
} from "../shared/types/index.js";

const normalizedConfigCache = new Map<string, typesAnalyticsConfigState>();

export function internalTryGetCachedConfiguration(
	configHash: string,
): typesAnalyticsConfigState | undefined {
	return normalizedConfigCache.get(configHash);
}

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

	const configHash =
		config.configHash ??
		internalCreateConfigurationHash({
			events,
			metrics,
			funnels,
			settings,
		});

	const cached = normalizedConfigCache.get(configHash);
	if (cached) {
		return cached;
	}

	const state: typesAnalyticsConfigState = {
		events,
		metrics,
		funnels,
		eventByName: new Map(events.map((event) => [event.name, event])),
		metricByName: new Map(metrics.map((metric) => [metric.name, metric])),
		funnelByName: new Map(
			Object.entries(funnels).map(([name, funnel]) => [name, funnel]),
		),
		settings,
		configHash,
	};

	normalizedConfigCache.set(configHash, state);
	return state;
}
