// TYPES
import type { typesAnalyticsTrafficMode } from "./primitives.js";

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
