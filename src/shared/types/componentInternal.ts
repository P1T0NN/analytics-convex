// TYPES
import type { Id } from "../../component/_generated/dataModel.js";
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsRuntimeConfig,
} from "./config.js";
import type { typesAnalyticsProperties } from "./primitives.js";
import type { typesAnalyticsMetricScope } from "./scopes.js";
import type { typesAnalyticsSettings } from "./settings.js";

export type typesAnalyticsAggregateEventInput = {
	eventId: Id<"analyticsEvents">;
	name: string;
	occurredAt: number;
	actorId?: string;
	organizationId?: string;
	subject?: {
		type: string;
		id: string;
	};
	scopes?: typesAnalyticsMetricScope[];
	properties: typesAnalyticsProperties;
};

export type typesAnalyticsConfigState = {
	events: typesAnalyticsEventConfigRuntime[];
	eventByName: Map<string, typesAnalyticsEventConfigRuntime>;
	metrics: typesAnalyticsMetricConfigRuntime[];
	metricByName: Map<string, typesAnalyticsMetricConfigRuntime>;
	funnels: typesAnalyticsFunnelsConfig;
	funnelByName: Map<string, typesAnalyticsFunnelConfig>;
	settings: typesAnalyticsSettings;
	configHash?: string;
};

export type { typesAnalyticsRuntimeConfig };
