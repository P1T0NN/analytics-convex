// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type { typesTrackEventInput } from "../types/types";

/**
 * Track an analytics event from a server-side mutation.
 *
 * Bypasses the authorization callback — use only from mutations that
 * already implement their own auth. Returns immediately after scheduling;
 * the actual write happens asynchronously.
 *
 * @example
 * await trackAnalyticsEvent(ctx, components.analytics, {
 *   name: "feature.used",
 *   properties: { feature: "search" },
 * });
 */
export async function trackAnalyticsEvent(
	ctx: Pick<GenericMutationCtx<GenericDataModel>, "runMutation">,
	component: ComponentApi,
	input: typesTrackEventInput,
) {
	return await ctx.runMutation(component.lib.writeTrack, input);
}
