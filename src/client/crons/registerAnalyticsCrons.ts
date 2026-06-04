// LIBRARIES
import type { Crons } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

/**
 * Register maintenance cron jobs for analytics.
 *
 * Sets up two jobs: high-volume batch aggregation and raw event retention
 * purging. Call once from your app's `convex/crons.ts`.
 *
 * @example
 * registerAnalyticsCrons(crons, components.analytics, {
 *   highVolumeBatchIntervalMinutes: 1,
 *   retentionIntervalHours: 24,
 * });
 */
export function registerAnalyticsCrons(
	crons: Crons,
	component: ComponentApi,
	options: {
		highVolumeBatchIntervalMinutes?: number;
		retentionIntervalHours?: number;
	} = {},
) {
	crons.interval(
		"process high-volume analytics events",
		{ minutes: options.highVolumeBatchIntervalMinutes ?? 1 },
		component.lib.processPendingHighVolumeAnalyticsEvents,
		{},
	);

	crons.interval(
		"purge stale analytics events",
		{ hours: options.retentionIntervalHours ?? 24 },
		component.lib.purgeStaleAnalyticsEvents,
		{},
	);
}
