// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// CONFIG
import { defaultSettings } from "../analyticsConfig";

// UTILS
import { validateConfiguration } from "../validations/validations";

// SCHEMAS
import {
	eventConfigValidator,
	metricConfigValidator,
	settingsPatchValidator,
} from "../schemas/schemas";

/**
 * Deprecated validation-only compatibility mutation.
 *
 * Runtime config is now passed from app-side analytics setup into component
 * functions, so this does not store anything.
 */
export const writeConfiguration = mutation({
	args: {
		events: v.array(eventConfigValidator),
		metrics: v.array(metricConfigValidator),
		settings: v.optional(settingsPatchValidator),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		validateConfiguration({
			events: args.events,
			metrics: args.metrics,
			settings: {
				...defaultSettings(),
				...(args.settings ?? {}),
			},
		});

		return null;
	},
});
