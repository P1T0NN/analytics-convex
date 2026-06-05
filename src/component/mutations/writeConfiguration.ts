// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// CONFIG
import { getConfigDoc, defaultSettings } from "../analyticsConfig";

// CONSTANTS
import { CONFIG_KEY } from "../constants";

// UTILS
import { validateConfiguration } from "../validations/validations";

// SCHEMAS
import {
	eventConfigValidator,
	metricConfigValidator,
	settingsPatchValidator,
} from "../schemas/schemas";

/**
 * Store events, metrics, and settings config.
 *
 * Run once after deploys that change event or metric definitions.
 * Merges with existing config — partial settings patches are supported.
 *
 * @example
 * await ctx.runMutation(components.analytics.lib.writeConfiguration, {
 *   events: [...],
 *   metrics: [...],
 * });
 */
export const writeConfiguration = mutation({
	args: {
		events: v.array(eventConfigValidator),
		metrics: v.array(metricConfigValidator),
		settings: v.optional(settingsPatchValidator),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await getConfigDoc(ctx);
		const settings = {
			...(existing?.settings ?? defaultSettings()),
			...(args.settings ?? {}),
		};

		validateConfiguration({
			events: args.events,
			metrics: args.metrics,
			settings,
		});

		const value = {
			events: args.events,
			metrics: args.metrics,
			settings,
			updatedAt: Date.now(),
		};

		if (existing) {
			await ctx.db.patch("analyticsConfigs", existing._id, value);
			return null;
		}

		await ctx.db.insert("analyticsConfigs", {
			key: CONFIG_KEY,
			...value,
		});
		return null;
	},
});
