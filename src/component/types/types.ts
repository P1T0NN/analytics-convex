// TYPES
import type { Id } from "../_generated/dataModel.js";

export type typesAnalyticsTrafficMode =
	| "lowVolume"
	| "mediumVolume"
	| "highVolume";
export type typesAnalyticsAggregation = "count" | "sum";
export type typesAnalyticsUnit = "count" | "currency" | "bytes";
export type typesAnalyticsPropertyType = "string" | "number" | "boolean";
export type typesAnalyticsPropertyValue = string | number | boolean | null;
export type typesAnalyticsProperties = Record<
	string,
	typesAnalyticsPropertyValue
>;
export type typesAnalyticsScopeType = "global" | "organization" | "resource";
export type typesHighVolumeStatus = "none" | "pending" | "processed";

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

export type typesAnalyticsEventConfig = {
	name: string;
	label: string;
	properties?: Record<string, typesAnalyticsPropertyType>;
	requiredProperties?: string[];
};

export type typesAnalyticsMetricConfig = {
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
};

export type typesAnalyticsMetricScope = {
	scopeType: typesAnalyticsScopeType;
	scopeId: string;
};

export type typesAnalyticsScope =
	| {
			type: "global";
			id: string;
	  }
	| {
			type: "organization";
			id: string;
	  }
	| {
			type: "resource";
			resourceType: string;
			resourceId: string;
			id: string;
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

export type typesAnalyticsSource = {
	type: "server" | "client" | "webhook" | "system";
	name?: string;
};

export type typesTrackEventInput = {
	name: string;
	occurredAt?: number;
	actorId?: string;
	organizationId?: string;
	subject?: {
		type: string;
		id: string;
	};
	scopes?: typesAnalyticsMetricScope[];
	properties?: Record<string, typesAnalyticsPropertyValue>;
	source?: typesAnalyticsSource;
};

export type typesPreparedTrackEventInput = {
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
	source: typesAnalyticsSource;
	idempotencyKey: string;
};

export type typesAnalyticsConfigState = {
	events: typesAnalyticsEventConfig[];
	eventByName: Map<string, typesAnalyticsEventConfig>;
	metrics: typesAnalyticsMetricConfig[];
	metricByName: Map<string, typesAnalyticsMetricConfig>;
	settings: typesAnalyticsSettings;
	configHash?: string;
};

export type typesAnalyticsRuntimeConfig = {
	events: typesAnalyticsEventConfig[];
	metrics: typesAnalyticsMetricConfig[];
	settings: typesAnalyticsSettings;
	configHash?: string;
};

export type typesRollupMode = "realtime" | "highVolume";

export type {
	typesAnalyticsRankingDirection,
	typesAnalyticsRankingTieBreaker,
	typesGetAnalyticsRankingArgs,
} from "../../shared/analyticsRanking";
