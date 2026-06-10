// TYPES
import type { Auth } from "convex/server";
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfig,
} from "./config.js";
import type { typesAnalyticsScopeInput } from "./scopes.js";
import type { typesAnalyticsSettings } from "./settings.js";

export type typesAnalyticsOperation =
	| { type: "configure" }
	| { type: "track"; name: string }
	| {
			type: "read";
			query:
				| "timeSeries"
				| "summary"
				| "breakdown"
				| "metricComparison"
				| "metricConversion"
				| "metricEvaluation"
				| "dashboardMetrics"
				| "funnelConversion"
				| "journeyConversion"
				| "metricTotalsByDimension"
				| "topDimensionValue";
			metric?: string;
			metrics?: string[];
			funnel?: string;
			journey?: string;
			scope?: typesAnalyticsScopeInput;
	  };

export type typesCreateAnalyticsApiOptionsForConfig<
	Events extends readonly typesAnalyticsEventConfig[] =
		readonly typesAnalyticsEventConfig[],
	Metrics extends readonly typesAnalyticsMetricConfig<
		string,
		Events[number]["name"]
	>[] = readonly typesAnalyticsMetricConfig<string, Events[number]["name"]>[],
> = {
	events: Events;
	metrics: Metrics;
	funnels?: typesAnalyticsFunnelsConfig;
	journeys?: typesAnalyticsJourneysConfig;
	settings?: Partial<typesAnalyticsSettings>;
	authorize?: (
		ctx: { auth: Auth },
		operation: typesAnalyticsOperation,
	) => Promise<void>;
};

export type typesCreateAnalyticsApiOptions<
	EventName extends string = string,
	MetricName extends string = string,
> = typesCreateAnalyticsApiOptionsForConfig<
	readonly typesAnalyticsEventConfig<EventName>[],
	readonly typesAnalyticsMetricConfig<MetricName, EventName>[]
>;
