export const ANALYTICS_SCOPE_SEPARATOR = ":";
export const ANALYTICS_RESOURCE_SCOPE_SEPARATOR = ANALYTICS_SCOPE_SEPARATOR;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
export const GLOBAL_SCOPE_ID = "__global";
export const TOTAL_DIMENSION = "__total";

/**
 * How many extra purge batches a retention cron may chain per tick when a
 * full batch was deleted, so retention keeps up with high write volume.
 */
export const DEFAULT_PURGE_CATCHUP_BATCHES = 20;

/** Dimension property names that explode rollup storage — rejected at configure time. */
export const ANALYTICS_HIGH_CARDINALITY_DIMENSIONS = [
	"userId",
	"user_id",
	"userid",
	"sessionId",
	"session_id",
	"sessionid",
	"actorId",
	"actor_id",
	"actorid",
	"email",
	"requestId",
	"request_id",
	"traceId",
	"trace_id",
	"ip",
	"ipAddress",
	"ip_address",
] as const;

export const ANALYTICS_TRAFFIC_MODE = {
	LOW_VOLUME: "lowVolume",
	MEDIUM_VOLUME: "mediumVolume",
	HIGH_VOLUME: "highVolume",
} as const;

/** Semantic metric health labels — the stable wire contract for evaluation results. */
export const ANALYTICS_METRIC_LABEL_KEYS = [
	"neutral",
	"activity",
	"good",
	"excellent",
	"bad",
	"clear",
] as const;

/** Default English display strings — localize or rebrand these in your UI. */
export const ANALYTICS_METRIC_LABELS = {
	neutral: "Neutral",
	activity: "Activity",
	good: "Good",
	excellent: "Excellent",
	bad: "Bad",
	clear: "Clear",
} as const satisfies Record<
	(typeof ANALYTICS_METRIC_LABEL_KEYS)[number],
	string
>;

/** Tone of each label for UI color mapping (positive → success, negative → danger). */
export const ANALYTICS_METRIC_LABEL_SENTIMENTS = {
	neutral: "neutral",
	activity: "neutral",
	good: "positive",
	excellent: "positive",
	bad: "negative",
	clear: "positive",
} as const satisfies Record<
	(typeof ANALYTICS_METRIC_LABEL_KEYS)[number],
	"positive" | "negative" | "neutral"
>;

export const ANALYTICS_LIMITS = {
	maxEventsPerConfiguration: 200,
	maxMetricsPerConfiguration: 200,
	maxPropertiesPerEventConfig: 50,
	maxRequiredPropertiesPerEvent: 50,
	maxEventNamesPerMetric: 50,
	maxDimensionsPerMetric: 8,
	maxTrackBatchSize: 100,
	maxScopesPerEvent: 20,
	maxPropertiesPerEvent: 50,
	maxIdentifierLength: 128,
	maxLabelLength: 256,
	maxDescriptionLength: 1_024,
	maxPropertyStringLength: 2_048,
	maxPropertyPayloadCharacters: 16_384,
	maxSourceNameLength: 128,
	maxUniqueKeyLength: 512,
	maxMediumVolumeShardCount: 64,
	maxHighVolumeShardCount: 256,
	maxHighVolumeBatchSize: 1_000,
	maxHighVolumeMaxCatchupBatches: 20,
	maxQueryRangeDays: 3_660,
	maxRollupRowsPerQuery: 100_000,
	maxBreakdownItems: 100,
	maxRawEventRetentionDays: 3_650,
	maxRawEventDeletesPerRun: 10_000,
	maxRollupRetentionDays: 3_650,
	maxRollupDeletesPerRun: 10_000,
	maxFunnelsPerConfiguration: 50,
	maxFunnelSteps: 10,
	maxJourneysPerConfiguration: 50,
	maxJourneySteps: 10,
	maxDashboardMetricsPerQuery: 24,
} as const;
