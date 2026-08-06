export const ANALYTICS_SCOPE_SEPARATOR = ":";
export const ANALYTICS_RESOURCE_SCOPE_SEPARATOR = ANALYTICS_SCOPE_SEPARATOR;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/**
 * Rollup buckets whose end is older than this are cold — no live writes touch
 * them — so the compaction cron may collapse their shard rows into one.
 */
export const ROLLUP_COMPACTION_LAG_MS = 2 * DAY_MS;

/**
 * Convex transaction limits (as of convex 1.36): a function may scan at most
 * 16,384 documents, and a mutation may write at most 8,192. The library keeps
 * every query and cron comfortably under them so its own descriptive errors
 * always fire before a raw Convex transaction error can.
 */
export const ANALYTICS_READ_BUDGET_CEILING = 12_288; // 75% of 16,384 scanned
export const ANALYTICS_WRITE_BUDGET_CEILING = 4_096; // 50% of 8,192 written

/** Row budget per compaction run: deletes + shard-0 merges stay ≤ 6,000 writes. */
export const ROLLUP_COMPACTION_MAX_ROWS_PER_RUN = 3_000;

/** Stored configuration rows older than this (and not active) are auto-pruned. */
export const CONFIGURATION_RETENTION_MS = 90 * DAY_MS;
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
	maxHighVolumeBatchSize: 500,
	maxHighVolumeMaxCatchupBatches: 20,
	/** One year plus a leap day. A hard ceiling — not raisable by settings. */
	maxQueryRangeDays: 366,
	maxRollupRowsPerQuery: 12_288,
	maxBreakdownItems: 100,
	maxRawEventRetentionDays: 3_650,
	maxRawEventDeletesPerRun: 4_096,
	maxRollupRetentionDays: 3_650,
	maxRollupDeletesPerRun: 4_096,
	maxFunnelsPerConfiguration: 50,
	maxFunnelSteps: 10,
	maxJourneysPerConfiguration: 50,
	maxJourneySteps: 10,
	maxDashboardMetricsPerQuery: 24,
} as const;
