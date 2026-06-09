// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// CONFIG
import { internalDefaultSettings } from "../analyticsConfig";

// HELPERS
import { internalEnsureConfiguration } from "../helpers/resolveConfiguration";

// UTILS
import { internalValidateConfiguration } from "../validations/validations";
import { internalCreateConfigurationHash } from "../utils/configurationHash.js";

// SCHEMAS
import {
	eventConfigValidator,
	funnelsConfigValidator,
	metricConfigValidator,
	settingsPatchValidator,
} from "../schemas/schemas";

/**
 * Validate and register analytics configuration by hash.
 *
 * Stores the config in the component database so later calls can pass
 * only `configHash`. Safe to call on deploy or from your app's
 * writeConfiguration mutation.
 */
export const writeConfiguration = mutation({
	args: {
		events: v.array(eventConfigValidator),
		metrics: v.array(metricConfigValidator),
		funnels: v.optional(funnelsConfigValidator),
		settings: v.optional(settingsPatchValidator),
	},
	returns: v.object({
		configHash: v.string(),
	}),
	handler: async (ctx, args) => {
		const settings = {
			...internalDefaultSettings(),
			...(args.settings ?? {}),
		};

		internalValidateConfiguration({
			events: args.events,
			metrics: args.metrics,
			funnels: args.funnels,
			settings,
		});

		const configHash = internalCreateConfigurationHash({
			events: args.events,
			metrics: args.metrics,
			funnels: args.funnels ?? {},
			settings,
		});

		await internalEnsureConfiguration(ctx, {
			configHash,
			config: {
				events: args.events,
				metrics: args.metrics,
				...(args.funnels ? { funnels: args.funnels } : {}),
				settings,
				configHash,
			},
		});

		return { configHash };
	},
});
