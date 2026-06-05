// LIBRARIES
import type {
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server";
import type { ComponentApi } from "../../component/_generated/component";

// UTILS
import { serializeEvents } from "../utils/serializeEvents";
import { serializeMetrics } from "../utils/serializeMetrics";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesTrackEventInput,
} from "../types/types";

export function createServerWrappers(
	component: ComponentApi,
	events: readonly typesAnalyticsEventConfig[],
	metrics: readonly typesAnalyticsMetricConfig[],
) {
	return {
		writeConfiguration: async (
			ctx: Pick<GenericMutationCtx<GenericDataModel>, "runMutation">,
			settings?: Record<string, unknown>,
		) => {
			await ctx.runMutation(component.lib.writeConfiguration, {
				events: serializeEvents(events),
				metrics: serializeMetrics(metrics),
				...(settings ? { settings } : {}),
			});
		},

		writeTrack: async (
			ctx: Pick<GenericMutationCtx<GenericDataModel>, "runMutation">,
			input: typesTrackEventInput,
		) => {
			return await ctx.runMutation(component.lib.writeTrack, input);
		},

		fetchTimeSeries: async (
			ctx: Pick<GenericQueryCtx<GenericDataModel>, "runQuery">,
			args: { metric: string; from: number; to: number; groupBy?: string; scope?: unknown; fill?: boolean },
		) => {
			return await ctx.runQuery(component.lib.fetchTimeSeries, args as any);
		},

		fetchSummary: async (
			ctx: Pick<GenericQueryCtx<GenericDataModel>, "runQuery">,
			args: { metric: string; from: number; to: number; scope?: unknown },
		) => {
			return await ctx.runQuery(component.lib.fetchSummary, args as any);
		},

		fetchBreakdown: async (
			ctx: Pick<GenericQueryCtx<GenericDataModel>, "runQuery">,
			args: { metric: string; from: number; to: number; groupBy: string; scope?: unknown },
		) => {
			return await ctx.runQuery(component.lib.fetchBreakdown, args as any);
		},

		fetchMetricComparison: async (
			ctx: Pick<GenericQueryCtx<GenericDataModel>, "runQuery">,
			args: { metric: string; from: number; to: number; scope?: unknown },
		) => {
			return await ctx.runQuery(component.lib.fetchMetricComparison, args as any);
		},

		fetchConfiguration: async (
			ctx: Pick<GenericQueryCtx<GenericDataModel>, "runQuery">,
		) => {
			return await ctx.runQuery(component.lib.fetchConfiguration, {});
		},
	};
}
