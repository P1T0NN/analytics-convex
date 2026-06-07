// LIBRARIES
import type { Crons } from "convex/server";

// TYPES
import type { typesAnalyticsRuntimeConfig } from "../types/types";

/**
 * Register maintenance cron jobs for analytics.
 *
 * Requires thin wrapper mutations in your app's `convex/analytics/crons.ts`
 * (see README for the snippet). Pass your app's `internal.analytics.crons`
 * as the third argument.
 *
 * @example
 * registerAnalyticsCrons(crons, internal.analytics.crons, config, {
 *   highVolumeBatchIntervalMinutes: 1,
 *   retentionIntervalHours: 24,
 * });
 */
export function registerAnalyticsCrons(
	crons: Crons,
	internalApi: {
		processPendingHighVolumeAnalyticsEvents: any;
		purgeStaleAnalyticsEvents: any;
	},
	config: typesAnalyticsRuntimeConfig,
	options: {
		highVolumeBatchIntervalMinutes?: number;
		retentionIntervalHours?: number;
	} = {},
) {
	crons.interval(
		"process high-volume analytics events",
		{ minutes: options.highVolumeBatchIntervalMinutes ?? 1 },
		internalApi.processPendingHighVolumeAnalyticsEvents,
		{ config },
	);

	crons.interval(
		"purge stale analytics events",
		{ hours: options.retentionIntervalHours ?? 24 },
		internalApi.purgeStaleAnalyticsEvents,
		{ config },
	);
}
