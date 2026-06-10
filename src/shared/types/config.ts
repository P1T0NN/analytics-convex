// TYPES
import type { typesMetricEvaluationConfig } from "./evaluation.js";
import type {
	typesAnalyticsAggregation,
	typesAnalyticsPropertyType,
	typesAnalyticsRollupGranularity,
	typesAnalyticsTrafficMode,
	typesAnalyticsUnit,
} from "./primitives.js";
import type { typesAnalyticsSettings } from "./settings.js";

/** Builder and app-side config — may use readonly arrays for literal inference. */
export type typesAnalyticsEventConfig<Name extends string = string> = {
	name: Name;
	label: string;
	properties?: Record<string, typesAnalyticsPropertyType>;
	requiredProperties?: readonly string[];
};

/** Builder and app-side config — may use readonly arrays for literal inference. */
export type typesAnalyticsMetricConfig<Name extends string = string, EventName extends string = string> = {
	name: Name;
	label: string;
	description?: string;
	unit: typesAnalyticsUnit;
	eventNames: readonly EventName[];
	aggregation: typesAnalyticsAggregation;
	valueProperty?: string;
	actorProperty?: string;
	dimensions?: readonly string[];
	trafficMode?: typesAnalyticsTrafficMode;
	rollupGranularity?: typesAnalyticsRollupGranularity;
	adminOnly?: boolean;
	evaluation?: typesMetricEvaluationConfig;
};

/** Serialized runtime config passed into component queries and mutations. */
export type typesAnalyticsEventConfigRuntime = {
	name: string;
	label: string;
	properties?: Record<string, typesAnalyticsPropertyType>;
	requiredProperties?: string[];
};

/** Serialized runtime config passed into component queries and mutations. */
export type typesAnalyticsMetricConfigRuntime = {
	name: string;
	label: string;
	description?: string;
	unit: typesAnalyticsUnit;
	eventNames: string[];
	aggregation: typesAnalyticsAggregation;
	valueProperty?: string;
	actorProperty?: string;
	dimensions?: string[];
	trafficMode?: typesAnalyticsTrafficMode;
	rollupGranularity?: typesAnalyticsRollupGranularity;
	adminOnly?: boolean;
	evaluation?: typesMetricEvaluationConfig;
};

export type typesAnalyticsJourneyConfig = {
	label: string;
	steps: string[];
	/** Event property used for journey breakdown (frozen from step 0). */
	breakdownProperty?: string;
};

export type typesAnalyticsJourneysConfig = Record<
	string,
	typesAnalyticsJourneyConfig
>;

export type typesAnalyticsFunnelConfig = {
	label: string;
	steps: string[];
};

export type typesAnalyticsFunnelsConfig = Record<
	string,
	typesAnalyticsFunnelConfig
>;

export type typesAnalyticsRuntimeConfig = {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels?: typesAnalyticsFunnelsConfig;
	journeys?: typesAnalyticsJourneysConfig;
	settings: typesAnalyticsSettings;
	configHash?: string;
};
