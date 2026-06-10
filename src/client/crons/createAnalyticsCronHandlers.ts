// LIBRARIES
import {
	internalMutationGeneric,
	type GenericDataModel,
	type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import type { ComponentApi } from "../../component/_generated/component.js";

// UTILS
import { internalAnalyticsConfigHashReference } from "../utils/configReference";

// TYPES
import type { typesAnalyticsRuntimeConfig } from "../../shared/types/index.js";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

/**
 * @internal Used by `defineAnalytics().crons` — not part of the public package API.
 *
 * Create app-side internal cron handler mutations for analytics maintenance.
 */
export function createAnalyticsCronHandlers(
	component: ComponentApi,
	config: typesAnalyticsRuntimeConfig,
) {
	const configReference = internalAnalyticsConfigHashReference(config);

	return {
		processPendingHighVolumeAnalyticsEvents: internalMutationGeneric({
			args: {
				configHash: v.string(),
				remainingCatchupBatches: v.optional(v.number()),
			},
			returns: v.object({
				processed: v.number(),
				scheduledNextBatch: v.boolean(),
			}),
			handler: async (ctx: typesMutationCtx, args) => {
				return await ctx.runMutation(
					component.lib.processPendingHighVolumeAnalyticsEvents,
					{
						configHash: args.configHash,
						...(args.remainingCatchupBatches !== undefined
							? { remainingCatchupBatches: args.remainingCatchupBatches }
							: {}),
					},
				);
			},
		}),
		purgeStaleAnalyticsEvents: internalMutationGeneric({
			args: {
				configHash: v.string(),
			},
			returns: v.object({
				deleted: v.number(),
				cutoff: v.optional(v.number()),
				skipped: v.boolean(),
			}),
			handler: async (ctx: typesMutationCtx, args) => {
				return await ctx.runMutation(
					component.lib.purgeStaleAnalyticsEvents,
					{
						configHash: args.configHash,
					},
				);
			},
		}),
		/** Pass this hash to cron registrations when using custom wrappers. */
		configHash: configReference.configHash,
	};
}
