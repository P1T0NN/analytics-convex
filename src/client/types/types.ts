// TYPES
import type { Auth } from "convex/server";

export const ANALYTICS_TRAFFIC_MODE = {
	LOW_VOLUME: "lowVolume",
	MEDIUM_VOLUME: "mediumVolume",
	HIGH_VOLUME: "highVolume",
} as const;

export type typesAnalyticsTrafficMode =
	(typeof ANALYTICS_TRAFFIC_MODE)[keyof typeof ANALYTICS_TRAFFIC_MODE];
export type typesAnalyticsPropertyType = "string" | "number" | "boolean";
export type typesAnalyticsPropertyValue = string | number | boolean | null;
export type typesAnalyticsUnit = "count" | "currency" | "bytes";
export type typesAnalyticsAggregation = "count" | "sum";
export type typesAnalyticsScopeType = "global" | "organization" | "resource";

export type typesAnalyticsEventConfig<Name extends string = string> = {
	name: Name;
	label: string;
	properties?: Record<string, typesAnalyticsPropertyType>;
	requiredProperties?: readonly string[];
};

export type typesAnalyticsMetricConfig<
	Name extends string = string,
	EventName extends string = string,
> = {
	name: Name;
	label: string;
	description?: string;
	unit: typesAnalyticsUnit;
	eventNames: readonly EventName[];
	aggregation: typesAnalyticsAggregation;
	valueProperty?: string;
	dimensions?: readonly string[];
	trafficMode?: typesAnalyticsTrafficMode;
	adminOnly?: boolean;
};

export type typesAnalyticsSettings = {
	trafficMode: typesAnalyticsTrafficMode;
	mediumVolumeShardCount: number;
	highVolumeShardCount: number;
	highVolumeBatchSize: number;
	highVolumeBatchIntervalMinutes: number;
	highVolumeMaxCatchupBatches: number;
	maxQueryRangeDays: number;
	maxRollupRowsPerQuery: number;
	maxBreakdownItems: number;
	rawEventRetentionDays: number;
	maxRawEventDeletesPerRun: number;
};

export type typesAnalyticsScopeInput =
	| {
			type: "global";
			id?: string;
		}
	| {
			type: "organization";
			id: string;
		}
	| {
			type: "resource";
			resourceType: string;
			id: string;
		};

export type typesAnalyticsMetricScope = {
	scopeType: typesAnalyticsScopeType;
	scopeId: string;
};

export type typesTrackEventInput<Name extends string = string> = {
	name: Name;
	occurredAt?: number;
	actorId?: string;
	organizationId?: string;
	subject?: {
		type: string;
		id: string;
	};
	scopes?: typesAnalyticsMetricScope[];
	properties?: Record<string, typesAnalyticsPropertyValue>;
	source?: {
		type: "server" | "client" | "webhook" | "system";
		name?: string;
	};
};

export type typesTrackEventsInput<Name extends string = string> =
	typesTrackEventInput<Name>[];

export type typesAnalyticsOperation =
	| { type: "configure" }
	| { type: "track"; name: string }
	| {
			type: "read";
			query: "timeSeries" | "summary" | "breakdown";
			metric: string;
			scope?: typesAnalyticsScopeInput;
		};

export type typesCreateAnalyticsApiOptions<
	EventName extends string = string,
	MetricName extends string = string,
> = {
	events: readonly typesAnalyticsEventConfig<EventName>[];
	metrics: readonly typesAnalyticsMetricConfig<MetricName, EventName>[];
	settings?: Partial<typesAnalyticsSettings>;
	authorize?: (
		ctx: { auth: Auth },
		operation: typesAnalyticsOperation,
	) => Promise<void>;
};
