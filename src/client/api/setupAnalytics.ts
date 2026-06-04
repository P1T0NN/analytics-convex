// LIBRARIES
import type { Crons } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// API
import { createAnalyticsApi } from "../api/createAnalyticsApi";

// CRONS
import { registerAnalyticsCrons } from "../crons/registerAnalyticsCrons";

// TYPES
import type { typesCreateAnalyticsApiOptions } from "../types/types";

/**
 * One-stop setup for analytics — mutations, queries, and cron registration.
 *
 * Replaces both `createAnalyticsApi` and `registerAnalyticsCrons`.
 * Call once in your app's `convex/analytics.ts` and once in `convex/crons.ts`.
 *
 * @example
 * // convex/analytics.ts
 * export const { writeConfiguration, writeTrack, timeSeries, ... } =
 *   setupAnalytics(components.analytics, { events, metrics });
 *
 * // convex/crons.ts
 * const crons = cronJobs();
 * analytics.registerCrons(crons);
 * export default crons;
 */
export function setupAnalytics<
	EventName extends string = string,
	MetricName extends string = string,
>(
	component: ComponentApi,
	options: typesCreateAnalyticsApiOptions<EventName, MetricName>,
) {
	const api = createAnalyticsApi(component, options);

	return {
		...api,
		/** Register maintenance cron jobs. Call from convex/crons.ts. */
		registerCrons(
			crons: Crons,
			cronOptions?: {
				highVolumeBatchIntervalMinutes?: number;
				retentionIntervalHours?: number;
			},
		) {
			registerAnalyticsCrons(crons, component, cronOptions);
		},
	};
}
