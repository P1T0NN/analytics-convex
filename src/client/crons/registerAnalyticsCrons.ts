// LIBRARIES
import type { Crons } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type { typesAnalyticsRuntimeConfig } from "../types/types";

/**
 * Register maintenance cron jobs for analytics.
 *
 * Sets up two jobs: high-volume batch aggregation and raw event retention
 * purging. Call once from your app's `convex/crons.ts`.
 *
 * @example
 * registerAnalyticsCrons(crons, components.analytics, config, {
 *   highVolumeBatchIntervalMinutes: 1,
 *   retentionIntervalHours: 24,
 * });
 */
export function registerAnalyticsCrons(
	crons: Crons,
	component: ComponentApi,
	config: typesAnalyticsRuntimeConfig,
	options: {
		highVolumeBatchIntervalMinutes?: number;
		retentionIntervalHours?: number;
	} = {},
) {
	crons.interval(
		"process high-volume analytics events",
		{ minutes: options.highVolumeBatchIntervalMinutes ?? 1 },
		component.lib.processPendingHighVolumeAnalyticsEvents,
		{ config },
	);

	crons.interval(
		"purge stale analytics events",
		{ hours: options.retentionIntervalHours ?? 24 },
		component.lib.purgeStaleAnalyticsEvents,
		{ config },
	);
}
