// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component";

// UTILS
import { createAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
	typesTrackEventInput,
	typesTrackEventsInput,
} from "../types/types";
import type {
	typesBreakdownArgs,
	typesMetricName,
	typesMetricRangeArgs,
	typesMetricTotalsByDimensionArgs,
	typesQueryCtx,
	typesTimeSeriesArgs,
	typesTopDimensionValueArgs,
} from "../types/analyticsReadTypes";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

type typesWriteTrackInput =
	| typesTrackEventInput
	| {
			events: typesTrackEventsInput;
	  };

export function createAnalyticsServerHelpers<
	const Metrics extends readonly typesAnalyticsMetricConfig[],
>(
	component: ComponentApi,
	events: readonly typesAnalyticsEventConfig[],
	metrics: Metrics,
	settings?: Partial<typesAnalyticsSettings>,
) {
	const config = createAnalyticsConfiguration(events, metrics, settings);

	const fetchMetricTotalsByDimension = async <
		Name extends typesMetricName<Metrics>,
	>(
		ctx: typesQueryCtx,
		args: typesMetricTotalsByDimensionArgs<Metrics, Name>,
	): Promise<Map<string, number>> => {
		const rows = await ctx.runQuery(
			component.lib.fetchMetricTotalsByDimension,
			{
				config,
				...args,
			},
		);

		return new Map(rows.map((row) => [row.key, row.value]));
	};

	const fetchTopDimensionValue = async <Name extends typesMetricName<Metrics>>(
		ctx: typesQueryCtx,
		args: typesTopDimensionValueArgs<Metrics, Name>,
	): Promise<string | null> => {
		return await ctx.runQuery(component.lib.fetchTopDimensionValue, {
			config,
			...args,
		});
	};

	return {
		writeConfiguration: async (
			ctx: typesMutationCtx,
			settings?: Record<string, unknown>,
		) => {
			await ctx.runMutation(component.lib.writeConfiguration, {
				events: config.events,
				metrics: config.metrics,
				settings: {
					...config.settings,
					...(settings ?? {}),
				},
			});
		},

		writeTrack: async (ctx: typesMutationCtx, input: typesWriteTrackInput) => {
			return await ctx.runMutation(component.lib.writeTrack, {
				config,
				...input,
			});
		},

		fetchTimeSeries: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesTimeSeriesArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchTimeSeries, {
				config,
				...args,
			});
		},

		fetchSummary: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchSummary, {
				config,
				...args,
			});
		},

		fetchBreakdown: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesBreakdownArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchBreakdown, {
				config,
				...args,
			});
		},

		fetchMetricComparison: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricComparison, {
				config,
				...args,
			});
		},

		fetchMetricTotalsByDimension,
		fetchDimensionTotals: fetchMetricTotalsByDimension,
		fetchTopDimensionValue,
		fetchTopDimension: fetchTopDimensionValue,

		fetchConfiguration: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(component.lib.fetchConfiguration, { config });
		},
	};
}
