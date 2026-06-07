// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type {
	typesAnalyticsRuntimeConfig,
	typesTrackEventInput,
	typesTrackEventsInput,
} from "../types/types";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

export type typesTrackAnalyticsInput =
	| typesTrackEventInput
	| {
			events: typesTrackEventsInput;
	  };

/**
 * Track one analytics event or a bounded batch from a server-side mutation.
 *
 * This bypasses the authorization callback, so use it only inside mutations
 * that already enforce app authorization.
 */
export async function trackAnalytics(
	ctx: typesMutationCtx,
	component: ComponentApi,
	input: typesTrackAnalyticsInput,
	config: typesAnalyticsRuntimeConfig,
) {
	return await ctx.runMutation(component.lib.writeTrack, {
		config,
		...input,
	});
}

export async function trackAnalyticsEvent(
	ctx: typesMutationCtx,
	component: ComponentApi,
	input: typesTrackEventInput,
	config: typesAnalyticsRuntimeConfig,
) {
	return await trackAnalytics(ctx, component, input, config);
}

export async function trackAnalyticsEvents(
	ctx: typesMutationCtx,
	component: ComponentApi,
	events: typesTrackEventsInput,
	config: typesAnalyticsRuntimeConfig,
) {
	return await trackAnalytics(ctx, component, { events }, config);
}
