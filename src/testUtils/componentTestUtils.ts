// LIBRARIES
import { convexTest } from "convex-test";

// COMPONENT
import schema from "../component/schema";

// DEFAULTS
import { internalDefaultAnalyticsSettings } from "../shared/utils/analyticsDefaultsUtils";

// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsRuntimeConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
} from "../shared/types/index.js";

export { DAY_MS } from "../shared/constants.js";

export function internalCreateAnalyticsComponentTest(
	modules: Record<string, () => Promise<unknown>>,
) {
	return convexTest(schema, modules);
}

export function internalRuntimeConfiguration(config: {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels?: typesAnalyticsFunnelsConfig;
	settings?: Partial<typesAnalyticsSettings>;
}): typesAnalyticsRuntimeConfig {
	return {
		events: config.events,
		metrics: config.metrics,
		...(config.funnels ? { funnels: config.funnels } : {}),
		settings: {
			...internalDefaultAnalyticsSettings(),
			...(config.settings ?? {}),
		},
	};
}

export function internalPageViewsConfiguration(): typesAnalyticsRuntimeConfig {
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
		settings: internalDefaultAnalyticsSettings(),
	};
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
