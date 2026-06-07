// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// UTILS
import { serializeEvents } from "../utils/serializeEvents";
import { serializeMetrics } from "../utils/serializeMetrics";

// TYPES
import type { typesCreateAnalyticsApiOptions } from "../types/types";

/**
 * Legacy validation-only helper.
 *
 * Normal usage passes config from `defineAnalytics` / `setupAnalytics` into
 * component functions automatically; no configure command is required.
 *
 * @example
 * await configureAnalytics(ctx, components.analytics, {
 *   events: [...],
 *   metrics: [...],
 * });
 */
export async function configureAnalytics(
	ctx: Pick<GenericMutationCtx<GenericDataModel>, "runMutation">,
	component: ComponentApi,
	options: Pick<
		typesCreateAnalyticsApiOptions,
		"events" | "metrics" | "settings"
	>,
) {
	await ctx.runMutation(component.lib.writeConfiguration, {
		events: serializeEvents(options.events),
		metrics: serializeMetrics(options.metrics),
		...(options.settings ? { settings: options.settings } : {}),
	});
}
