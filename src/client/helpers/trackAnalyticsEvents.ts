// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type { typesTrackEventInput } from "../types/types";

/**
 * Track a bounded batch of analytics events from a server-side mutation.
 *
 * Bypasses the authorization callback, so use only from mutations that already
 * implement their own auth. Returns immediately after scheduling.
 */
export async function trackAnalyticsEvents(
  ctx: Pick<GenericMutationCtx<GenericDataModel>, "runMutation">,
  component: ComponentApi,
  events: typesTrackEventInput[],
) {
  return await ctx.runMutation(component.lib.writeTrack, { events });
}
