// LIBRARIES
import { convexTest } from "convex-test";

// COMPONENT
import schema from "../component/schema";

// DEFAULTS
import { defaultAnalyticsSettings } from "../shared/analyticsDefaults";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsRuntimeConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
} from "../component/types/types";

export const DAY_MS = 86_400_000;

export function createAnalyticsComponentTest(
	modules: Record<string, () => Promise<unknown>>,
) {
	return convexTest(schema, modules);
}

export function runtimeConfiguration(config: {
	events: typesAnalyticsEventConfig[];
	metrics: typesAnalyticsMetricConfig[];
	funnels?: typesAnalyticsFunnelsConfig;
	settings?: Partial<typesAnalyticsSettings>;
}): typesAnalyticsRuntimeConfig {
	return {
		events: config.events,
		metrics: config.metrics,
		...(config.funnels ? { funnels: config.funnels } : {}),
		settings: {
			...defaultAnalyticsSettings(),
			...(config.settings ?? {}),
		},
	};
}

export function pageViewsConfiguration(): typesAnalyticsRuntimeConfig {
	return {
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
		settings: defaultAnalyticsSettings(),
	};
}

export function revenueConfiguration(
	settings?: Partial<typesAnalyticsSettings>,
) {
	return runtimeConfiguration({
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
