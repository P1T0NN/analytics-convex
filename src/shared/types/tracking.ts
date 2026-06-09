// TYPES
import type { typesAnalyticsProperties, typesAnalyticsPropertyValue } from "./primitives.js";
import type { typesAnalyticsMetricScope } from "./scopes.js";

export type typesAnalyticsSource = {
	type: "server" | "client" | "webhook" | "system";
	name?: string;
};

export type typesAnalyticsUnique = {
	key: string;
	scope?: "forever";
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
	source?: typesAnalyticsSource;
	unique?: typesAnalyticsUnique;
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
	unique?: typesAnalyticsUnique;
};

export type typesWriteTrackResult = {
	scheduled: boolean;
	scheduledCount: number;
	deduped?: boolean;
	dedupedCount?: number;
};

export type typesTrackEventsInput<Name extends string = string> = typesTrackEventInput<Name>[];
