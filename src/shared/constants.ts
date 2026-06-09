export const ANALYTICS_SCOPE_SEPARATOR = ":";
export const ANALYTICS_RESOURCE_SCOPE_SEPARATOR = ANALYTICS_SCOPE_SEPARATOR;

export const DAY_MS = 24 * 60 * 60 * 1000;
export const GLOBAL_SCOPE_ID = "__global";
export const TOTAL_DIMENSION = "__total";

export const ANALYTICS_TRAFFIC_MODE = {
	LOW_VOLUME: "lowVolume",
	MEDIUM_VOLUME: "mediumVolume",
	HIGH_VOLUME: "highVolume",
} as const;

export const ANALYTICS_METRIC_LABELS = {
	neutral: "Neutral",
	activity: "Activity",
	good: "Good",
	excellent: "Excellent",
	bad: "Bad",
	clear: "Clear",
} as const;

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
	maxFunnelsPerConfiguration: 50,
	maxFunnelSteps: 10,
	maxDashboardMetricsPerQuery: 24,
} as const;
