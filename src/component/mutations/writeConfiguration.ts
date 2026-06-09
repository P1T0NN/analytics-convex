// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// CONFIG
import { internalDefaultSettings } from "../analyticsConfig";

// UTILS
import { internalValidateConfiguration } from "../validations/validations";

// SCHEMAS
import {
	eventConfigValidator,
	funnelsConfigValidator,
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
		funnels: v.optional(funnelsConfigValidator),
		settings: v.optional(settingsPatchValidator),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		internalValidateConfiguration({
			events: args.events,
			metrics: args.metrics,
			funnels: args.funnels,
			settings: {
				...internalDefaultSettings(),
				...(args.settings ?? {}),
			},
		});

		return null;
	},
});
