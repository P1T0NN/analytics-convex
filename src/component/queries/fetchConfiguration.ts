// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// HELPERS
import { getConfigDoc } from "../analyticsConfig";

// SCHEMAS
import {
		eventConfigValidator,
		metricConfigValidator,
		settingsValidator,
} from "../schemas/schemas";

/**
 * Read the current analytics config.
 *
 * Returns the stored events, metrics, and settings document,
 * or null if configure has not been called yet.
 *
 * @example
 * const config = await ctx.runQuery(components.analytics.lib.fetchConfiguration, {});
 */
export const fetchConfiguration = query({
		args: {},
		returns: v.union(
				v.null(),
				v.object({
						events: v.array(eventConfigValidator),
						metrics: v.array(metricConfigValidator),
						settings: settingsValidator,
						updatedAt: v.number(),
				}),
		),
		handler: async (ctx) => {
				const doc = await getConfigDoc(ctx);
				if (!doc) return null;
		
				return {
						events: doc.events,
						metrics: doc.metrics,
						settings: doc.settings,
						updatedAt: doc.updatedAt,
				};
		},
});
