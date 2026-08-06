export function internalDefaultAnalyticsSettings() {
	return {
		trafficMode: "mediumVolume" as const,
		mediumVolumeShardCount: 8,
		highVolumeShardCount: 32,
		highVolumeBatchSize: 250,
		highVolumeBatchIntervalMinutes: 1,
		highVolumeMaxCatchupBatches: 4,
		maxQueryRangeDays: 366,
		maxRollupRowsPerQuery: 12_288,
		maxBreakdownItems: 12,
		rawEventRetentionDays: 90,
		maxRawEventDeletesPerRun: 4_000,
		rollupRetentionDays: 0,
		maxRollupDeletesPerRun: 4_000,
		defaultTimezone: "UTC",
	};
}
