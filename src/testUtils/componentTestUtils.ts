// LIBRARIES
import { convexTest } from "convex-test";

// COMPONENT
import schema from "../component/schema";

// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../shared/utils/analyticsDefaultsUtils";
import { internalCreateConfigurationHash } from "../shared/utils/configurationHashUtils";

// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsRuntimeConfig,
} from "../shared/types/config.js";
import type {
	typesAnalyticsSettings,
} from "../shared/types/settings.js";

export { DAY_MS, HOUR_MS } from "../shared/constants.js";

export function internalCreateAnalyticsComponentTest(
	modules: Record<string, () => Promise<unknown>>,
) {
	return convexTest(schema, modules);
}

export function internalRuntimeConfiguration(config: {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels?: typesAnalyticsFunnelsConfig;
	journeys?: typesAnalyticsJourneysConfig;
	settings?: Partial<typesAnalyticsSettings>;
}): typesAnalyticsRuntimeConfig {
	const settings = {
		...internalDefaultAnalyticsSettings(),
		...(config.settings ?? {}),
	};
	const funnels = config.funnels ?? {};
	const journeys = config.journeys ?? {};
	const configHash = internalCreateConfigurationHash({
		events: config.events,
		metrics: config.metrics,
		funnels,
		journeys,
		settings,
	});

	return {
		events: config.events,
		metrics: config.metrics,
		...(config.funnels ? { funnels: config.funnels } : {}),
		...(config.journeys ? { journeys: config.journeys } : {}),
		settings,
		configHash,
	};
}

export function internalAnalyticsConfigArgs(
	config: typesAnalyticsRuntimeConfig,
) {
	return {
		configHash: config.configHash!,
		config,
	};
}

export function internalPageViewsConfiguration(): typesAnalyticsRuntimeConfig {
	return internalRuntimeConfiguration({
		events: [{ name: "page.viewed", label: "Page viewed" }],
		metrics: [
			{
				name: "pageViews",
				label: "Page views",
				unit: "count" as const,
				eventNames: ["page.viewed"],
				aggregation: "count" as const,
			},
		],
	});
}

export function internalRevenueConfiguration(
	settings?: Partial<typesAnalyticsSettings>,
) {
	return internalRuntimeConfiguration({
		events: [
			{
				name: "purchase.completed",
				label: "Purchase completed",
				properties: { amount: "number" as const, plan: "string" as const },
			},
		],
		metrics: [
			{
				name: "revenue",
				label: "Revenue",
				unit: "currency" as const,
				eventNames: ["purchase.completed"],
				aggregation: "sum" as const,
				valueProperty: "amount",
				dimensions: ["plan"],
				trafficMode: "highVolume" as const,
			},
		],
		settings,
	});
}
