// LIBRARIES
import type { Crons } from "convex/server";

// TYPES
import type { typesAnalyticsRuntimeConfig } from "../../shared/types/index.js";

/**
 * @internal Used by `defineAnalytics().registerCrons()` — not part of the public package API.
 *
 * Register maintenance cron jobs for analytics.
 */
export function registerAnalyticsCrons(
	crons: Crons,
	internalApi: {
		processPendingHighVolumeAnalyticsEvents: Parameters<Crons["interval"]>[2];
		purgeStaleAnalyticsEvents: Parameters<Crons["interval"]>[2];
	},
	config: typesAnalyticsRuntimeConfig,
	options: {
		highVolumeBatchIntervalMinutes?: number;
		retentionIntervalHours?: number;
	} = {},
) {
	if (!config.configHash) {
		throw new Error("Analytics configuration is missing configHash.");
	}

	const configHash = config.configHash;

	crons.interval(
		"process high-volume analytics events",
		{ minutes: options.highVolumeBatchIntervalMinutes ?? 1 },
		internalApi.processPendingHighVolumeAnalyticsEvents,
		{ configHash },
	);

	crons.interval(
		"purge stale analytics events",
		{ hours: options.retentionIntervalHours ?? 24 },
		internalApi.purgeStaleAnalyticsEvents,
		{ configHash },
	);
}
