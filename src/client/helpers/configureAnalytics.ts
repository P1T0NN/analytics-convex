// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// UTILS
import { internalSerializeEvents } from "../utils/serializeEvents";
import { internalSerializeMetrics } from "../utils/serializeMetrics";

// TYPES
import type { typesCreateAnalyticsApiOptions } from "../../shared/types/index.js";

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
		events: internalSerializeEvents(options.events),
		metrics: internalSerializeMetrics(options.metrics),
		...(options.settings ? { settings: options.settings } : {}),
	});
}
