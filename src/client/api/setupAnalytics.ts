// LIBRARIES
import type { Crons } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// API
import { createAnalyticsApi } from "../api/createAnalyticsApi";

// CRONS
import { registerAnalyticsCrons } from "../crons/registerAnalyticsCrons";

// HELPERS
import { createServerWrappers } from "../helpers/createServerWrappers";

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
	const server = createServerWrappers(
		component,
		options.events,
		options.metrics as any,
	);

	const client = createAnalyticsApi(component, options);

	return {
		...server,
		/** Convex function builders — export for `useMutation` / `useQuery`. */
		client,
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
