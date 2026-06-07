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

export type typesPropertyValueForConfig<Type> = Type extends "string"
	? string
	: Type extends "number"
		? number
		: Type extends "boolean"
			? boolean
			: never;

type typesEventConfigForName<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Extract<Events[number], { name: Name }>;

type typesPropertiesConfigForEvent<Event> = Event extends {
	properties: infer Properties;
}
	? Properties
	: Record<string, never>;

type typesRequiredPropertyNamesForEvent<Event> = Event extends {
	requiredProperties: readonly (infer RequiredProperty)[];
}
	? RequiredProperty
	: never;

type typesTypedPropertiesInput<Event> =
	typesPropertiesConfigForEvent<Event> extends Record<
		string,
		typesAnalyticsPropertyType
	>
		? {
				[Key in Extract<
					typesRequiredPropertyNamesForEvent<Event>,
					keyof typesPropertiesConfigForEvent<Event>
				>]: typesPropertyValueForConfig<
					typesPropertiesConfigForEvent<Event>[Key]
				>;
			} & {
				[Key in Exclude<
					keyof typesPropertiesConfigForEvent<Event>,
					typesRequiredPropertyNamesForEvent<Event>
				>]?: typesPropertyValueForConfig<
					typesPropertiesConfigForEvent<Event>[Key]
				> | null;
			}
		: Record<string, never>;

type typesTrackPropertiesField<Event> =
	Extract<
		typesRequiredPropertyNamesForEvent<Event>,
		keyof typesPropertiesConfigForEvent<Event>
	> extends never
		? { properties?: typesTypedPropertiesInput<Event> }
		: { properties: typesTypedPropertiesInput<Event> };

export type typesTypedTrackEventInput<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Omit<typesTrackEventInput<Name>, "name" | "properties"> & {
	name: Name;
} & typesTrackPropertiesField<typesEventConfigForName<Events, Name>>;

export type typesTypedTrackEventOptions<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Omit<typesTypedTrackEventInput<Events, Name>, "name">;

export type typesTypedTrackEventInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> = {
	[Name in Events[number]["name"]]: typesTypedTrackEventInput<Events, Name>;
}[Events[number]["name"]];

export type typesTypedTrackBatchInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> = {
	events: readonly typesTypedTrackEventInputForEvents<Events>[];
};

export type typesUnifiedTrackInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> =
	| typesTypedTrackEventInputForEvents<Events>
	| typesTypedTrackBatchInputForEvents<Events>;

export type typesAnalyticsOperation =
	| { type: "configure" }
	| { type: "track"; name: string }
	| {
			type: "read";
			query: "timeSeries" | "summary" | "breakdown" | "metricComparison";
			metric: string;
			scope?: typesAnalyticsScopeInput;
	  };

export type typesCreateAnalyticsApiOptions<
	EventName extends string = string,
	MetricName extends string = string,
> = typesCreateAnalyticsApiOptionsForConfig<
	readonly typesAnalyticsEventConfig<EventName>[],
	readonly typesAnalyticsMetricConfig<MetricName, EventName>[]
>;

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
	settings?: Partial<typesAnalyticsSettings>;
	authorize?: (
		ctx: { auth: Auth },
		operation: typesAnalyticsOperation,
	) => Promise<void>;
};

export type typesAnalyticsRuntimeConfig = {
	events: Array<{
		name: string;
		label: string;
		properties?: Record<string, typesAnalyticsPropertyType>;
		requiredProperties?: string[];
	}>;
	metrics: Array<{
		name: string;
		label: string;
		description?: string;
		unit: typesAnalyticsUnit;
		eventNames: string[];
		aggregation: typesAnalyticsAggregation;
		valueProperty?: string;
		dimensions?: string[];
		trafficMode?: typesAnalyticsTrafficMode;
		adminOnly?: boolean;
	}>;
	settings: typesAnalyticsSettings;
	configHash?: string;
};
