// LIBRARIES
import type { Crons } from "convex/server";

// TYPES
import type { typesAnalyticsRuntimeConfig } from "../../shared/types/index.js";

/**
 * Register maintenance cron jobs for analytics.
 *
 * Pass thin wrapper mutations from `createAnalyticsCronHandlers()` as
 * `internalApi`, or define your own app wrappers that forward `configHash`.
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
