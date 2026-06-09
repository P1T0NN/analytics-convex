// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// SCHEMAS
import {
	configReferenceFields,
	eventConfigValidator,
	funnelsConfigValidator,
	metricConfigValidator,
	settingsValidator,
} from "../schemas/schemas";

/**
 * Read the runtime analytics config passed by the app-side analytics setup.
 */
export const fetchConfiguration = query({
	args: {
		...configReferenceFields,
	},
	returns: v.object({
		events: v.array(eventConfigValidator),
		metrics: v.array(metricConfigValidator),
		funnels: v.optional(funnelsConfigValidator),
		settings: settingsValidator,
		configHash: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		return {
			events: config.events,
			metrics: config.metrics,
			...(Object.keys(config.funnels).length > 0
				? { funnels: config.funnels }
				: {}),
			settings: config.settings,
			configHash: config.configHash,
		};
	},
});
