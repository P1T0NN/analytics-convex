// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
	eventConfigValidator,
	metricConfigValidator,
	settingsValidator,
} from "../schemas/schemas";

/**
 * Read the runtime analytics config passed by the app-side analytics setup.
 */
export const fetchConfiguration = query({
	args: {
		config: analyticsRuntimeConfigValidator,
	},
	returns: v.object({
		events: v.array(eventConfigValidator),
		metrics: v.array(metricConfigValidator),
		settings: settingsValidator,
		configHash: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const config = normalizeConfig(args.config);

		return {
			events: config.events,
			metrics: config.metrics,
			settings: config.settings,
			configHash: config.configHash,
		};
	},
});
