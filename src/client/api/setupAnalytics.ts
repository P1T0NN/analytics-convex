// LIBRARIES
import type { Crons } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// API
import { createAnalyticsApi } from "../api/createAnalyticsApi";

// CRONS
import { registerAnalyticsCrons } from "../crons/registerAnalyticsCrons";

// HELPERS
import { createAnalyticsServerHelpers } from "../helpers/createAnalyticsServerHelpers";

// UTILS
import { createAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesCreateAnalyticsApiOptionsForConfig,
} from "../types/types";

/**
 * One-stop setup for analytics — server wrappers, client exports,
 * and cron registration.
 *
 * @example
 * // convex/analytics.ts
 * export const analytics =
 *   setupAnalytics(components.analytics, { events, metrics });
 * export const { writeConfiguration, writeTrack, fetchTimeSeries, fetchSummary, fetchBreakdown } =
 *   analytics.client;
 *
 * // convex/products.ts (server mutation)
 * await analytics.writeTrack(ctx, { name: "product.viewed", ... });
 *
 * // convex/crons.ts
 * const crons = cronJobs();
 * analytics.registerCrons(crons);
 * export default crons;
 */
export function setupAnalytics<
	const Events extends readonly typesAnalyticsEventConfig[],
	const Metrics extends readonly typesAnalyticsMetricConfig<
		string,
		Events[number]["name"]
	>[],
>(
	component: ComponentApi,
	options: typesCreateAnalyticsApiOptionsForConfig<Events, Metrics>,
) {
	const server = createAnalyticsServerHelpers(
		component,
		options.events,
		options.metrics as any,
		options.settings,
	);

	const client = createAnalyticsApi(component, options);
	const config = createAnalyticsConfiguration(
		options.events,
		options.metrics,
		options.settings,
	);

	return {
		...server,
		/** Convex function builders — export for `useMutation` / `useQuery`. */
		client,
		/** Register maintenance cron jobs. Call from convex/crons.ts. */
		registerCrons(
			crons: Crons,
			internalApi: any,
			cronOptions?: {
				highVolumeBatchIntervalMinutes?: number;
				retentionIntervalHours?: number;
			},
		) {
			registerAnalyticsCrons(crons, internalApi, config, cronOptions);
		},
	};
}
