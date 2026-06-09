// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component";

// UTILS
import { internalCreateAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
	typesTrackEventInput,
	typesTrackEventsInput,
} from "../../shared/types/index.js";
import type {
	typesBreakdownArgs,
	typesDashboardMetricsArgs,
	typesFunnelConversionArgs,
	typesMetricConversionArgs,
	typesMetricEvaluationArgs,
	typesMetricName,
	typesMetricRangeArgs,
	typesMetricTotalsByDimensionArgs,
	typesQueryCtx,
	typesTimeSeriesArgs,
	typesTopDimensionValueArgs,
} from "../../shared/types/queryArgs.js";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

type typesWriteTrackInput =
	| typesTrackEventInput
	| {
			events: typesTrackEventsInput;
	  };

export function internalCreateAnalyticsServerHelpers<
	const Metrics extends readonly typesAnalyticsMetricConfig[],
>(
	component: ComponentApi,
	events: readonly typesAnalyticsEventConfig[],
	metrics: Metrics,
	settings?: Partial<typesAnalyticsSettings>,
	funnels?: typesAnalyticsFunnelsConfig,
) {
	const config = internalCreateAnalyticsConfiguration(
		events,
		metrics,
		settings,
		funnels,
	);

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
				...(config.funnels ? { funnels: config.funnels } : {}),
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

		fetchMetricConversion: async <
			Numerator extends typesMetricName<Metrics>,
			Denominator extends typesMetricName<Metrics>,
		>(
			ctx: typesQueryCtx,
			args: typesMetricConversionArgs<Metrics, Numerator, Denominator>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricConversion, {
				config,
				...args,
			});
		},

		fetchMetricEvaluation: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricEvaluationArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricEvaluation, {
				config,
				...args,
			});
		},

		fetchDashboardMetrics: async (
			ctx: typesQueryCtx,
			args: typesDashboardMetricsArgs<Metrics>,
		) => {
			return await ctx.runQuery(component.lib.fetchDashboardMetrics, {
				config,
				...args,
			});
		},

		fetchFunnelConversion: async (
			ctx: typesQueryCtx,
			args: typesFunnelConversionArgs,
		) => {
			return await ctx.runQuery(component.lib.fetchFunnelConversion, {
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
